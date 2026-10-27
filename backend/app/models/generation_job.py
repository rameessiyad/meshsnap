import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

# Allowed job states:
#   pending      - created in our database, not yet sent to the provider
#   submitting   - being sent to the provider right now
#   queued       - accepted by the provider, waiting in its queue
#   in_progress  - provider is generating the model
#   completed    - provider finished and the result was retrieved
#   failed       - provider or our code reported an error
#   cancelled    - cancelled by the user
JOB_STATUSES = (
    "pending",
    "submitting",
    "queued",
    "in_progress",
    "completed",
    "failed",
    "cancelled",
)


class GenerationJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One image-to-3D generation request sent to an AI provider."""

    __tablename__ = "generation_jobs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','submitting','queued','in_progress',"
            "'completed','failed','cancelled')",
            name="status_valid",
        ),
        # A provider's request id is unique within that provider.
        # (NULLs are allowed, so jobs not yet submitted do not conflict.)
        UniqueConstraint("provider", "provider_request_id"),
        # Stops a double-click or retry from creating (and paying for) two jobs.
        UniqueConstraint("user_id", "idempotency_key"),
        # "List my jobs, newest first" and daily quota counting.
        Index("ix_generation_jobs_user_id_created_at", "user_id", "created_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Provider details. Kept as plain strings so adding Tripo later needs no migration.
    provider: Mapped[str] = mapped_column(
        String(50), nullable=False, default="fal", server_default="fal"
    )
    model: Mapped[str] = mapped_column(String(100), nullable=False)

    # The request id returned by the provider's queue API.
    provider_request_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        server_default="pending",
        index=True,
    )

    # Provider options chosen by the user (never secrets or API keys).
    parameters: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )

    # Client-generated key so the same click is never submitted twice.
    idempotency_key: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Number of times we tried to submit this job to the provider.
    attempt_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    # Safe, user-facing error text. Never store raw provider responses
    # or anything that could contain secrets.
    error_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancel_requested_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"<GenerationJob id={self.id} status={self.status!r}>"