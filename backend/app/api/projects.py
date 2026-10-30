import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Header,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import AuthContext, get_auth_context, require_csrf
from app.core.config import get_settings
from app.db.session import get_db
from app.models.generated_asset import GeneratedAsset
from app.models.generation_job import GenerationJob
from app.models.project import Project
from app.schemas.generation import JobPublic
from app.schemas.project import ProjectCreate, ProjectPublic, ProjectUpdate
from app.services import generation_service, storage
from app.services.image_validation import InvalidImageError, validate_image_upload

router = APIRouter(prefix="/projects", tags=["projects"])


def get_owned_project(db: Session, project_id: uuid.UUID, user_id: uuid.UUID) -> Project:
    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user_id,
            Project.deleted_at.is_(None),
        )
    )
    if project is None:
        # Same answer for "does not exist" and "belongs to someone else".
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


def project_to_public(db: Session, project: Project) -> ProjectPublic:
    job = generation_service.latest_job(db, project.id)
    asset = generation_service.latest_model_asset(db, project.id)
    thumb = generation_service.latest_preview_asset(db, project.id)
    return ProjectPublic(
        id=project.id,
        name=project.name,
        description=project.description,
        has_source_image=bool(project.source_image_key),
        created_at=project.created_at,
        latest_job=JobPublic.model_validate(job) if job else None,
        model_asset_id=asset.id if asset else None,
        thumbnail_asset_id=thumb.id if thumb else None,
    )


@router.post("", response_model=ProjectPublic, status_code=status.HTTP_201_CREATED)
def create_project(
    body: ProjectCreate,
    ctx: AuthContext = Depends(get_auth_context),
    _csrf: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> ProjectPublic:
    project = Project(user_id=ctx.user.id, name=body.name, description=body.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project_to_public(db, project)


@router.get("", response_model=list[ProjectPublic])
def list_projects(
    q: str | None = Query(default=None, max_length=100),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> list[ProjectPublic]:
    stmt = select(Project).where(
        Project.user_id == ctx.user.id, Project.deleted_at.is_(None)
    )
    if q and q.strip():
        term = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        stmt = stmt.where(Project.name.ilike(f"%{term}%", escape="\\"))
    projects = db.scalars(stmt.order_by(Project.created_at.desc()).limit(200)).all()
    return [project_to_public(db, p) for p in projects]


@router.get("/{project_id}", response_model=ProjectPublic)
def get_project(
    project_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> ProjectPublic:
    return project_to_public(db, get_owned_project(db, project_id, ctx.user.id))


@router.patch("/{project_id}", response_model=ProjectPublic)
def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    ctx: AuthContext = Depends(get_auth_context),
    _csrf: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> ProjectPublic:
    project = get_owned_project(db, project_id, ctx.user.id)
    if "name" in body.model_fields_set:
        project.name = body.name  # validator guarantees it is not None
    if "description" in body.model_fields_set:
        project.description = body.description
    db.commit()
    db.refresh(project)
    return project_to_public(db, project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth_context),
    _csrf: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> Response:
    project = get_owned_project(db, project_id, ctx.user.id)
    if generation_service.active_job_for_project(db, project.id) is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "A generation is running. Cancel it or wait for it to finish.",
        )

    now = datetime.now(timezone.utc)
    files: list[tuple[str, str, str]] = []

    assets = db.scalars(
        select(GeneratedAsset).where(
            GeneratedAsset.project_id == project.id,
            GeneratedAsset.deleted_at.is_(None),
        )
    ).all()
    for asset in assets:
        asset.deleted_at = now
        files.append((asset.storage_backend, asset.storage_key, "model"))

    if project.source_image_key:
        try:
            backend, key = storage.parse_ref(project.source_image_key)
            files.append((backend, key, "image"))
        except storage.StorageError:
            pass
        project.source_image_key = None

    project.deleted_at = now
    db.commit()

    # Soft delete keeps the rows (history, usage); the files themselves are removed.
    for backend, key, kind in files:
        storage.delete_file(backend, key, kind)  # type: ignore[arg-type]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{project_id}/image", response_model=ProjectPublic)
def upload_image(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    ctx: AuthContext = Depends(get_auth_context),
    _csrf: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> ProjectPublic:
    project = get_owned_project(db, project_id, ctx.user.id)
    if generation_service.active_job_for_project(db, project.id) is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Wait for the running generation to finish first"
        )

    settings = get_settings()
    # Read one byte more than the limit, so oversized files are detected
    # without loading an arbitrarily large upload into memory.
    data = file.file.read(settings.max_upload_bytes + 1)
    try:
        content_type, extension = validate_image_upload(data, settings.max_upload_bytes)
    except InvalidImageError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    try:
        stored = storage.save_file(data, ctx.user.id, "image", extension)
    except storage.StorageError:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not store the image")

    old_ref = project.source_image_key
    project.source_image_key = stored.ref
    project.source_image_content_type = content_type
    project.source_image_size_bytes = len(data)
    project.source_image_sha256 = hashlib.sha256(data).hexdigest()
    db.commit()
    db.refresh(project)

    if old_ref:
        try:
            old_backend, old_key = storage.parse_ref(old_ref)
            storage.delete_file(old_backend, old_key, "image")
        except storage.StorageError:
            pass

    return project_to_public(db, project)


@router.get("/{project_id}/image")
def get_image(
    project_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> Response:
    project = get_owned_project(db, project_id, ctx.user.id)
    if not project.source_image_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No image uploaded")
    try:
        backend, key = storage.parse_ref(project.source_image_key)
        data = storage.read_file(backend, key, "image")
    except storage.StorageError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found")
    return Response(
        content=data,
        media_type=project.source_image_content_type or "application/octet-stream",
        headers={
            "Cache-Control": "private, max-age=300",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.post(
    "/{project_id}/generate",
    response_model=JobPublic,
    status_code=status.HTTP_202_ACCEPTED,
)
def generate(
    project_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key", max_length=64),
    ctx: AuthContext = Depends(get_auth_context),
    _csrf: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> JobPublic:
    project = get_owned_project(db, project_id, ctx.user.id)
    job, created = generation_service.create_job(db, ctx.user.id, project, idempotency_key)
    db.commit()
    db.refresh(job)
    if created:
        background_tasks.add_task(generation_service.run_generation_job, job.id)
    return JobPublic.model_validate(job)


@router.get("/{project_id}/jobs", response_model=list[JobPublic])
def list_jobs(
    project_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> list[JobPublic]:
    project = get_owned_project(db, project_id, ctx.user.id)
    jobs = db.scalars(
        select(GenerationJob)
        .where(GenerationJob.project_id == project.id)
        .order_by(GenerationJob.created_at.desc())
        .limit(20)
    ).all()
    return [JobPublic.model_validate(j) for j in jobs]