import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import AuthContext, get_auth_context, require_csrf
from app.core.config import get_settings
from app.db.session import get_db
from app.models.generated_asset import GeneratedAsset
from app.models.generation_job import GenerationJob
from app.schemas.generation import JobPublic, QuotaPublic
from app.services import generation_service, storage

router = APIRouter(tags=["generation"])


def _owned_job(db: Session, job_id: uuid.UUID, user_id: uuid.UUID) -> GenerationJob:
    job = db.scalar(
        select(GenerationJob).where(
            GenerationJob.id == job_id, GenerationJob.user_id == user_id
        )
    )
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return job


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
    now = datetime.now(timezone.utc)
    if job.status == "pending":
        job.status = "cancelled"
        job.cancel_requested_at = now
        job.completed_at = now
    elif job.status in ("submitting", "queued", "in_progress"):
        # The running task checks this flag when the provider returns.
        job.cancel_requested_at = job.cancel_requested_at or now
    else:
        raise HTTPException(status.HTTP_409_CONFLICT, "This job already finished")
    db.commit()
    db.refresh(job)
    return JobPublic.model_validate(job)


@router.get("/assets/{asset_id}/file")
def download_asset(
    asset_id: uuid.UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
) -> Response:
    asset = db.scalar(
        select(GeneratedAsset).where(
            GeneratedAsset.id == asset_id,
            GeneratedAsset.user_id == ctx.user.id,
            GeneratedAsset.deleted_at.is_(None),
        )
    )
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    try:
        data = storage.read_file(asset.storage_backend, asset.storage_key, "model")
    except storage.StorageError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")

    filename = asset.original_filename or "model.glb"
    return Response(
        content=data,
        media_type=asset.content_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    )


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