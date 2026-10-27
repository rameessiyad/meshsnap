from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    # Always stored lowercase and trimmed by the application, so the plain
    # unique constraint behaves as case-insensitive uniqueness.
    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        index=True,
        nullable=False,
    )

    # Argon2id hash only. The plain password is never stored.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # "user" or "admin". Kept as a string so new roles need no migration.
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="user",
        server_default="user",
    )

    # Lets you disable an account without deleting its data.
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # Optional per-user override of the default daily generation quota.
    # NULL means "use the global default from settings".
    daily_generation_limit: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    def __repr__(self) -> str:
        # Deliberately excludes password_hash.
        return f"<User id={self.id} email={self.email!r}>"