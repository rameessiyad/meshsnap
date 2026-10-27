import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin


class UsageRecord(UUIDPrimaryKeyMixin, Base):
    """One billable event (a generation) used for daily quotas and cost tracking.

    Records are append-only: the application inserts them and never edits them.
    """

    __tablename__ = "usage_records"
    __table_args__ = (
        CheckConstraint("kind IN ('generation')", name="kind_valid"),
        CheckConstraint("units >= 0", name="units_non_negative"),
        # A job can only be counted once, so retries never double-count.
        # (NULL job_id values do not conflict with each other.)
        UniqueConstraint("job_id", "kind"),
        # Daily quota check: "how many generations did this user use today?"
        Index("ix_usage_records_user_id_usage_date", "user_id", "usage_date"),
    )

    # Deleting an account deletes its usage rows (personal data).
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # If a job is deleted, the usage row stays, so cost history is not lost.
    job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("generation_jobs.id", ondelete="SET NULL"),
        nullable=True,
    )

    kind: Mapped[str] = mapped_column(
        String(30), nullable=False, default="generation", server_default="generation"
    )

    # How many quota units this event used (normally 1).
    units: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )

    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)

    # Our estimate in US dollars, from the provider's published pricing.
    # NULL means "unknown", not zero. This is not an invoice.
    estimated_cost_usd: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 4), nullable=True
    )

    # The UTC calendar day the usage counts toward. Quota windows are
    # defined in UTC so they do not shift with server time zone settings.
    usage_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        server_default=text("(timezone('utc', now()))::date"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<UsageRecord id={self.id} user_id={self.user_id} units={self.units}>"