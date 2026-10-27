from datetime import datetime, timedelta, timezone

from fastapi import Response
from sqlalchemy.orm import Session

from app.core.security import hash_password, hash_token
from app.models.user import User
from app.services import session_service as svc


def make_user(db: Session, is_active: bool = True) -> User:
    user = User(
        email="session-test@example.com",
        password_hash=hash_password("CorrectHorse1"),
        is_active=is_active,
    )
    db.add(user)
    db.flush()
    return user


def test_create_session_stores_only_the_hash(db: Session) -> None:
    user = make_user(db)
    raw_token, session = svc.create_session(db, user, "127.0.0.1", "pytest")

    assert session.token_hash != raw_token
    assert session.token_hash == hash_token(raw_token)
    assert len(session.csrf_token) >= 32


def test_valid_token_returns_session_and_user(db: Session) -> None:
    user = make_user(db)
    raw_token, session = svc.create_session(db, user, None, None)

    found = svc.get_valid_session(db, raw_token)
    assert found is not None
    assert found[0].id == session.id
    assert found[1].id == user.id


def test_unknown_token_is_rejected(db: Session) -> None:
    make_user(db)
    assert svc.get_valid_session(db, "not-a-real-token") is None


def test_revoked_session_is_rejected(db: Session) -> None:
    user = make_user(db)
    raw_token, session = svc.create_session(db, user, None, None)

    svc.revoke_session(db, session)
    assert svc.get_valid_session(db, raw_token) is None


def test_expired_session_is_rejected(db: Session) -> None:
    user = make_user(db)
    raw_token, session = svc.create_session(db, user, None, None)

    session.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.flush()
    assert svc.get_valid_session(db, raw_token) is None


def test_inactive_user_session_is_rejected(db: Session) -> None:
    user = make_user(db)
    raw_token, _ = svc.create_session(db, user, None, None)

    user.is_active = False
    db.flush()
    assert svc.get_valid_session(db, raw_token) is None


def test_session_cookie_flags_in_development() -> None:
    response = Response()
    svc.set_session_cookie(response, "abc123")
    header = response.headers["set-cookie"].lower()

    assert "httponly" in header
    assert "samesite=lax" in header
    assert "secure" not in header  # development runs on http://localhost