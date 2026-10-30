import hashlib
import logging
import re
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.generated_asset import GeneratedAsset
from app.models.generation_job import GenerationJob
from app.models.project import Project
from app.models.usage_record import UsageRecord
from app.services import storage
from app.services.providers import get_provider
from app.services.providers.base import ProviderError

logger = logging.getLogger(__name__)

ACTIVE_STATUSES = ("pending", "submitting", "queued", "in_progress")


def _now() -> datetime:
    return datetime.now(timezone.utc)


@contextmanager
def background_session() -> Iterator[Session]:
    """A DB session for code that runs outside a request (background tasks)."""
    gen = get_db()
    db = next(gen)
    try:
        yield db
    finally:
        gen.close()


# ---------- queries ----------


def latest_job(db: Session, project_id: uuid.UUID) -> GenerationJob | None:
    return db.scalar(
        select(GenerationJob)
        .where(GenerationJob.project_id == project_id)
        .order_by(GenerationJob.created_at.desc())
        .limit(1)
    )


def latest_model_asset(db: Session, project_id: uuid.UUID) -> GeneratedAsset | None:
    return db.scalar(
        select(GeneratedAsset)
        .where(
            GeneratedAsset.project_id == project_id,
            GeneratedAsset.kind == "glb",
            GeneratedAsset.deleted_at.is_(None),
        )
        .order_by(GeneratedAsset.created_at.desc())
        .limit(1)
    )

def latest_preview_asset(db: Session, project_id: uuid.UUID) -> GeneratedAsset | None:
    return db.scalar(
        select(GeneratedAsset)
        .where(
            GeneratedAsset.project_id == project_id,
            GeneratedAsset.kind == "preview_image",
            GeneratedAsset.deleted_at.is_(None),
        )
        .order_by(GeneratedAsset.created_at.desc())
        .limit(1)
    )


def remove_preview_assets(db: Session, project_id: uuid.UUID) -> None:
    """Drop the project's thumbnail(s). The viewer captures a fresh one."""
    previews = db.scalars(
        select(GeneratedAsset).where(
            GeneratedAsset.project_id == project_id,
            GeneratedAsset.kind == "preview_image",
            GeneratedAsset.deleted_at.is_(None),
        )
    ).all()
    if not previews:
        return
    refs = [(a.storage_backend, a.storage_key) for a in previews]
    now = _now()
    for asset in previews:
        asset.deleted_at = now
    db.commit()
    for backend, key in refs:
        storage.delete_file(backend, key, "image")

def active_job_for_project(db: Session, project_id: uuid.UUID) -> GenerationJob | None:
    return db.scalar(
        select(GenerationJob)
        .where(
            GenerationJob.project_id == project_id,
            GenerationJob.status.in_(ACTIVE_STATUSES),
        )
        .limit(1)
    )


def used_today(db: Session, user_id: uuid.UUID) -> int:
    """Finished generations today (UTC) plus jobs still running."""
    today = _now().date()
    finished = db.scalar(
        select(func.coalesce(func.sum(UsageRecord.units), 0)).where(
            UsageRecord.user_id == user_id, UsageRecord.usage_date == today
        )
    )
    active = db.scalar(
        select(func.count())
        .select_from(GenerationJob)
        .where(
            GenerationJob.user_id == user_id,
            GenerationJob.status.in_(ACTIVE_STATUSES),
        )
    )
    return int(finished or 0) + int(active or 0)


# ---------- creating a job (inside a request) ----------


def create_job(
    db: Session,
    user_id: uuid.UUID,
    project: Project,
    idempotency_key: str | None,
) -> tuple[GenerationJob, bool]:
    """Returns (job, created). created=False means an existing job was returned."""
    if idempotency_key:
        existing = db.scalar(
            select(GenerationJob).where(
                GenerationJob.user_id == user_id,
                GenerationJob.idempotency_key == idempotency_key,
            )
        )
        if existing is not None:
            if existing.project_id != project.id:
                raise HTTPException(
                    status.HTTP_409_CONFLICT, "Idempotency key already used"
                )
            return existing, False

    if not project.source_image_key:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Upload a reference image before generating"
        )
    if active_job_for_project(db, project.id) is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "A generation is already running for this project"
        )

    limit = get_settings().daily_generation_limit
    if used_today(db, user_id) >= limit:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Daily generation limit reached ({limit}). Try again tomorrow (UTC).",
        )

    provider = get_provider()
    job = GenerationJob(
        user_id=user_id,
        project_id=project.id,
        provider=provider.name,
        model=provider.model_name,
        status="pending",
        parameters={},
        idempotency_key=idempotency_key,
    )
    db.add(job)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "This generation request was already submitted"
        )
    return job, True


# ---------- running a job (background task) ----------


def _mark_failed(db: Session, job_id: uuid.UUID, code: str, message: str) -> None:
    job = db.get(GenerationJob, job_id)
    if job is None or job.status not in ACTIVE_STATUSES:
        return
    job.status = "failed"
    job.error_code = code
    job.error_message = message
    job.completed_at = _now()
    db.commit()


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:60] or "model"


def _execute(db: Session, job: GenerationJob, project: Project | None) -> None:
    provider = get_provider()

    job.status = "submitting"
    job.attempt_count += 1
    job.submitted_at = _now()
    db.commit()

    if project is None or project.deleted_at is not None or not project.source_image_key:
        _mark_failed(db, job.id, "project_unavailable", "The project is no longer available.")
        return

    try:
        backend, key = storage.parse_ref(project.source_image_key)
        image_bytes = storage.read_file(backend, key, "image")
    except storage.StorageError:
        _mark_failed(db, job.id, "storage_error", "Could not read the reference image.")
        return
    content_type = project.source_image_content_type or "image/png"

        # The user may have cancelled while we were submitting.
    db.refresh(job)
    if job.cancel_requested_at is not None:
        return

    job.status = "in_progress"
    db.commit()

    try:
        output = provider.generate(image_bytes, content_type)
    except ProviderError as exc:
        _mark_failed(db, job.id, "provider_error", str(exc))
        return

    db.refresh(job)
    if job.cancel_requested_at is not None:
        job.status = "cancelled"
        job.completed_at = _now()
        db.commit()
        return

    try:
        stored = storage.save_file(output.glb_bytes, job.user_id, "model", ".glb")
    except storage.StorageError:
        _mark_failed(db, job.id, "storage_error", "Could not save the generated model.")
        return

    db.add(
        GeneratedAsset(
            user_id=job.user_id,
            project_id=job.project_id,
            job_id=job.id,
            kind="glb",
            storage_backend=stored.backend,
            storage_key=stored.key,
            content_type="model/gltf-binary",
            size_bytes=len(output.glb_bytes),
            sha256=hashlib.sha256(output.glb_bytes).hexdigest(),
            original_filename=f"{_slug(project.name)}.glb",
        )
    )
    db.add(
        UsageRecord(
            user_id=job.user_id,
            job_id=job.id,
            kind="generation",
            units=1,
            provider=job.provider,
            model=job.model,
            estimated_cost_usd=None,
        )
    )
    if output.provider_job_id:
        job.provider_request_id = output.provider_job_id
        job.status = "completed"
        
    job.completed_at = _now()
    db.commit()
    # A new model makes the old thumbnail stale.
    remove_preview_assets(db, job.project_id)


def run_generation_job(job_id: uuid.UUID) -> None:
    """Background task. Opens its own DB session and never raises."""
    with background_session() as db:
        try:
            job = db.get(GenerationJob, job_id)
            if job is None or job.status != "pending":
                return
            project = db.get(Project, job.project_id)
            _execute(db, job, project)
        except Exception:
            logger.exception("Generation job %s crashed", job_id)
            db.rollback()
            _mark_failed(
                db, job_id, "internal_error", "Something went wrong while generating the model."
            )


def fail_interrupted_jobs() -> int:
    """Called at server start: jobs left running by a restart can never finish."""
    with background_session() as db:
        jobs = db.scalars(
            select(GenerationJob).where(GenerationJob.status.in_(ACTIVE_STATUSES))
        ).all()
        for job in jobs:
            job.status = "failed"
            job.error_code = "server_restarted"
            job.error_message = "The server restarted while this was generating. Please try again."
            job.completed_at = _now()
        db.commit()
        return len(jobs)