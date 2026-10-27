import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin
from sqlalchemy import func


class PasswordResetToken(UUIDPrimaryKeyMixin, Base):
    """A single-use, short-lived token that lets a user set a new password."""

    __tablename__ = "password_reset_tokens"

    # Deleting a user deletes their reset tokens.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # SHA-256 hex digest of the random token sent to the user.
    # The raw token is never stored, so a database leak cannot be used
    # to reset anyone's password.
    token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # Set when the token is used. A token with used_at set must be rejected,
    # which makes every token single-use.
    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        # Deliberately excludes token_hash.
        return f"<PasswordResetToken id={self.id} user_id={self.user_id}>"