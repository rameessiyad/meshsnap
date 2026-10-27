import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class GeneratedAsset(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A real file produced by a completed generation job (for example a GLB)."""

    __tablename__ = "generated_assets"
    __table_args__ = (
        CheckConstraint(
            "kind IN ('glb','gltf','preview_image','other')",
            name="kind_valid",
        ),
        CheckConstraint(
            "storage_backend IN ('local','cloudinary')",
            name="storage_backend_valid",
        ),
        # The same stored file can never be registered twice.
        UniqueConstraint("storage_backend", "storage_key"),
        # "Show the assets of my project" with an ownership filter.
        Index("ix_generated_assets_user_id_project_id", "user_id", "project_id"),
    )

    # user_id is stored on the asset itself so every download can be checked
    # against the logged-in user with one simple query.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("generation_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    kind: Mapped[str] = mapped_column(String(20), nullable=False)

    # Where the file lives, and its private key inside that storage.
    # This is a storage key, never a public URL. Downloads go through
    # our API, which checks ownership first.
    storage_backend: Mapped[str] = mapped_column(String(20), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)

    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # SHA-256 hex digest of the stored bytes, for integrity checks.
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)

    # Friendly name shown on download, for example "my-model.glb".
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Soft delete, so the record survives for audit and cost history.
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        # Excludes storage_key so internal paths do not end up in logs.
        return f"<GeneratedAsset id={self.id} kind={self.kind!r}>"