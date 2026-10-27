from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import tokens_match
from app.db.session import get_db
from app.models.session import UserSession
from app.models.user import User
from app.services.session_service import get_valid_session, touch_session

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


@dataclass
class AuthContext:
    user: User
    session: UserSession


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


def get_auth_context(
    request: Request,
    db: Session = Depends(get_db),
) -> AuthContext:
    """Resolve the logged-in user from the session cookie, or respond 401."""
    settings = get_settings()
    raw_token = request.cookies.get(settings.session_cookie_name)
    if not raw_token:
        raise _unauthorized()

    found = get_valid_session(db, raw_token)
    if found is None:
        raise _unauthorized()

    session, user = found
    touch_session(db, session)
    return AuthContext(user=user, session=session)


def get_current_user(ctx: AuthContext = Depends(get_auth_context)) -> User:
    return ctx.user


def require_csrf(
    request: Request,
    ctx: AuthContext = Depends(get_auth_context),
) -> None:
    """CSRF protection for state-changing requests (POST, PUT, PATCH, DELETE).

    Two checks:
    1. If the browser sent an Origin header, it must be our frontend.
    2. The X-CSRF-Token header must match the token stored on the session.
    """
    if request.method in SAFE_METHODS:
        return

    settings = get_settings()

    origin = request.headers.get("origin")
    if origin is not None and origin != settings.frontend_origin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Origin not allowed",
        )

    header_token = request.headers.get("x-csrf-token")
    if not header_token or not tokens_match(header_token, ctx.session.csrf_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing or invalid",
        )