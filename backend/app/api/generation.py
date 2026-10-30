import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import AuthContext, get_auth_context, require_csrf
from app.api.projects import get_owned_project, project_to_public
from app.core.config import get_settings
from app.db.session import get_db
from app.models.generated_asset import GeneratedAsset
from app.models.generation_job import GenerationJob
from app.schemas.generation import JobPublic, QuotaPublic, VersionPublic
from app.schemas.project import ProjectPublic
from app.services import generation_service, model_export, storage
from app.services.image_validation import InvalidImageError, validate_image_upload

router = APIRouter(tags=["generation"])

THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024


def _owned_job(db: Session, job_id: uuid.UUID, user_id: uuid.UUID) -> GenerationJob:
    job = db.scalar(
        select(GenerationJob).where(
            GenerationJob.id == job_id, GenerationJob.user_id == user_id
        )
    )
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return job


def _owned_asset(db: Session, asset_id: uuid.UUID, user_id: uuid.UUID) -> GeneratedAsset:
    asset = db.scalar(
        select(GeneratedAsset).where(
            GeneratedAsset.id == asset_id,
            GeneratedAsset.user_id == user_id,
            GeneratedAsset.deleted_at.is_(None),
        )
    )
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    return asset


@router.get("/jobs/{job_id}", response_model=JobPublic)
def get_job(
    job_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> JobPublic:
    """Poll this to follow a generation."""
    return JobPublic.model_validate(_owned_job(db, job_id, ctx.user.id))


@router.post("/jobs/{job_id}/cancel", response_model=JobPublic)
def cancel_job(
    job_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth_context),
    _csrf: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> JobPublic:
    job = _owned_job(db, job_id, ctx.user.id)
    if job.status not in generation_service.ACTIVE_STATUSES:
        raise HTTPException(status.HTTP_409_CONFLICT, "This job already finished")

    # Finish the job right away so the project is free again. If the provider
    # is still running, its result is discarded when it returns.
    now = datetime.now(timezone.utc)
    job.status = "cancelled"
    job.cancel_requested_at = job.cancel_requested_at or now
    job.completed_at = now
    db.commit()
    db.refresh(job)
    return JobPublic.model_validate(job)


@router.get("/assets/{asset_id}/file")
def download_asset(
    asset_id: uuid.UUID,
    fmt: Literal["glb", "obj", "stl"] = Query(default="glb", alias="format"),
    download: bool = False,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> Response:
    asset = _owned_asset(db, asset_id, ctx.user.id)
    kind = "image" if asset.kind == "preview_image" else "model"
    try:
        data = storage.read_file(asset.storage_backend, asset.storage_key, kind)
    except storage.StorageError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")

    content_type = asset.content_type
    filename = (asset.original_filename or "model.glb").replace('"', "")

    if fmt != "glb":
        if asset.kind != "glb":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only models can be converted")
        try:
            data, content_type = model_export.convert_glb(data, fmt)
        except model_export.ExportError:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, "Could not convert this model"
            )
        filename = f"{Path(filename).stem}.{fmt}"

    disposition = "attachment" if download else "inline"
    return Response(
        content=data,
        media_type=content_type,
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_version(
    asset_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth_context),
    _csrf: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> Response:
    """Delete one model version."""
    asset = _owned_asset(db, asset_id, ctx.user.id)
    if asset.kind != "glb":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only model versions can be deleted")

    latest = generation_service.latest_model_asset(db, asset.project_id)
    was_latest = latest is not None and latest.id == asset.id
    project_id = asset.project_id
    backend, key = asset.storage_backend, asset.storage_key

    asset.deleted_at = datetime.now(timezone.utc)
    db.commit()
    storage.delete_file(backend, key, "model")

    if was_latest:
        generation_service.remove_preview_assets(db, project_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/projects/{project_id}/versions", response_model=list[VersionPublic])
def list_versions(
    project_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> list[VersionPublic]:
    project = get_owned_project(db, project_id, ctx.user.id)
    assets = db.scalars(
        select(GeneratedAsset)
        .where(
            GeneratedAsset.project_id == project.id,
            GeneratedAsset.kind == "glb",
            GeneratedAsset.deleted_at.is_(None),
        )
        .order_by(GeneratedAsset.created_at.desc())
        .limit(50)
    ).all()
    total = len(assets)
    return [
        VersionPublic(
            asset_id=a.id,
            job_id=a.job_id,
            version=total - i,
            is_latest=(i == 0),
            size_bytes=a.size_bytes,
            created_at=a.created_at,
        )
        for i, a in enumerate(assets)
    ]


@router.post("/projects/{project_id}/thumbnail", response_model=ProjectPublic)
def upload_thumbnail(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    ctx: AuthContext = Depends(get_auth_context),
    _csrf: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> ProjectPublic:
    """The viewer captures a snapshot of the latest model and uploads it here."""
    project = get_owned_project(db, project_id, ctx.user.id)
    model = generation_service.latest_model_asset(db, project.id)
    if model is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Generate a model first")

    data = file.file.read(THUMBNAIL_MAX_BYTES + 1)
    try:
        content_type, extension = validate_image_upload(data, THUMBNAIL_MAX_BYTES)
    except InvalidImageError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    try:
        stored = storage.save_file(data, ctx.user.id, "image", extension)
    except storage.StorageError:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not store the thumbnail")

    generation_service.remove_preview_assets(db, project.id)

    import hashlib

    db.add(
        GeneratedAsset(
            user_id=ctx.user.id,
            project_id=project.id,
            job_id=model.job_id,
            kind="preview_image",
            storage_backend=stored.backend,
            storage_key=stored.key,
            content_type=content_type,
            size_bytes=len(data),
            sha256=hashlib.sha256(data).hexdigest(),
            original_filename=f"thumbnail{extension}",
        )
    )
    db.commit()
    return project_to_public(db, project)


@router.get("/usage/today", response_model=QuotaPublic)
def usage_today(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> QuotaPublic:
    settings = get_settings()
    return QuotaPublic(
        used=generation_service.used_today(db, ctx.user.id),
        limit=settings.daily_generation_limit,
        provider=settings.generation_provider,
    )