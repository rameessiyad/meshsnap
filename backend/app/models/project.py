import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Project(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A user's project: one reference image and the 3D models generated from it."""

    __tablename__ = "projects"
    __table_args__ = (
        # Speeds up "list my projects, newest first" and ownership lookups.
        Index("ix_projects_user_id_created_at", "user_id", "created_at"),
    )

    # Deleting a user deletes their project rows. Files in storage are not
    # removed by the database, so account deletion code must clean them up too.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Private storage key of the uploaded reference image (not a public URL).
    # Empty until the image has been uploaded and validated.
    source_image_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_image_content_type: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    source_image_size_bytes: Mapped[int | None] = mapped_column(
        BigInteger, nullable=True
    )
    # SHA-256 hex digest of the image bytes, useful for integrity checks.
    source_image_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Soft delete: set when the user deletes the project, so generation history
    # and usage records stay intact for quota and cost tracking.
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} user_id={self.user_id} name={self.name!r}>"