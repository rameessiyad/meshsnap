from datetime import datetime, timedelta, timezone

from fastapi import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import generate_token, hash_token
from app.models.session import UserSession
from app.models.user import User

# last_seen_at is only updated this often, to avoid a database write on every request.
TOUCH_INTERVAL = timedelta(minutes=5)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_session(
    db: Session,
    user: User,
    ip_address: str | None,
    user_agent: str | None,
) -> tuple[str, UserSession]:
    """Create a login session. Returns (raw_token, session_row).

    The raw token goes into the browser cookie and is never stored.
    The caller must commit the transaction.
    """
    settings = get_settings()
    raw_token = generate_token()
    now = _now()

    session = UserSession(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        csrf_token=generate_token(),
        expires_at=now + timedelta(hours=settings.session_ttl_hours),
        last_seen_at=now,
        ip_address=ip_address[:45] if ip_address else None,
        user_agent=user_agent[:255] if user_agent else None,
    )
    db.add(session)
    db.flush()
    return raw_token, session


def get_valid_session(db: Session, raw_token: str) -> tuple[UserSession, User] | None:
    """Return (session, user) only if the token is known, not expired,
    not revoked, and the user is still active. Otherwise None."""
    stmt = (
        select(UserSession, User)
        .join(User, User.id == UserSession.user_id)
        .where(
            UserSession.token_hash == hash_token(raw_token),
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > _now(),
            User.is_active.is_(True),
        )
    )
    row = db.execute(stmt).first()
    if row is None:
        return None
    return row[0], row[1]


def touch_session(db: Session, session: UserSession) -> None:
    """Update last_seen_at, at most once per TOUCH_INTERVAL."""
    now = _now()
    if session.last_seen_at is None or now - session.last_seen_at > TOUCH_INTERVAL:
        session.last_seen_at = now
        db.commit()


def revoke_session(db: Session, session: UserSession) -> None:
    """Log out: mark the session revoked. The caller must commit."""
    session.revoked_at = _now()
    db.flush()


def set_session_cookie(response: Response, raw_token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.session_cookie_name,
        value=raw_token,
        max_age=settings.session_ttl_hours * 3600,
        httponly=True,  # JavaScript cannot read the cookie
        secure=settings.cookie_secure,  # HTTPS-only in production
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )