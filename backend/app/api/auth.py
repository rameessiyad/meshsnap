import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import AuthContext, get_auth_context, require_csrf
from app.core.config import get_settings
from app.core.security import (
    hash_password,
    password_needs_rehash,
    verify_dummy_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserPublic
from app.services import session_service
from app.services.rate_limiter import (
    RateLimiter,
    login_ip_limiter,
    login_pair_limiter,
    register_limiter,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _too_many_requests(limiter: RateLimiter, key: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many attempts. Please try again later.",
        headers={"Retry-After": str(limiter.retry_after(key))},
    )


def _invite_code_valid(supplied: str | None, valid_codes: list[str]) -> bool:
    if not supplied:
        return False
    # Compare against every code (no early exit) in constant time.
    matched = False
    for code in valid_codes:
        if secrets.compare_digest(supplied.encode("utf-8"), code.encode("utf-8")):
            matched = True
    return matched


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    settings = get_settings()

    if settings.registration_mode == "closed":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is closed",
        )

    # Every attempt counts, including failed invite codes, so codes cannot be guessed.
    ip = _client_ip(request)
    if register_limiter.is_blocked(ip):
        raise _too_many_requests(register_limiter, ip)
    register_limiter.record(ip)

    if settings.registration_mode == "invite_only" and not _invite_code_valid(
        body.invite_code, settings.invite_code_list
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A valid invite code is required",
        )

    already_exists = db.scalar(select(User.id).where(User.email == body.email))
    if already_exists is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        # Two requests registered the same email at the same moment.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    raw_token, session = session_service.create_session(
        db, user, ip, request.headers.get("user-agent")
    )
    csrf_token = session.csrf_token
    db.commit()
    db.refresh(user)

    session_service.set_session_cookie(response, raw_token)
    return AuthResponse(user=UserPublic.model_validate(user), csrf_token=csrf_token)


@router.post("/login", response_model=AuthResponse)
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    ip = _client_ip(request)
    pair_key = f"{ip}|{body.email}"

    # Check limits before doing any password work.
    if login_pair_limiter.is_blocked(pair_key):
        raise _too_many_requests(login_pair_limiter, pair_key)
    if login_ip_limiter.is_blocked(ip):
        raise _too_many_requests(login_ip_limiter, ip)

    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
    )

    user = db.scalar(select(User).where(User.email == body.email))

    if user is None or not user.is_active:
        # Same work and same message as a wrong password, so attackers cannot
        # tell whether an email is registered or an account is disabled.
        verify_dummy_password(body.password)
        login_pair_limiter.record(pair_key)
        login_ip_limiter.record(ip)
        raise invalid

    if not verify_password(body.password, user.password_hash):
        login_pair_limiter.record(pair_key)
        login_ip_limiter.record(ip)
        raise invalid

    # Success: forgive earlier typos for this account from this IP.
    login_pair_limiter.clear_key(pair_key)

    # Upgrade the stored hash if the Argon2 cost settings have increased.
    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(body.password)

    raw_token, session = session_service.create_session(
        db, user, ip, request.headers.get("user-agent")
    )
    csrf_token = session.csrf_token
    db.commit()

    session_service.set_session_cookie(response, raw_token)
    return AuthResponse(user=UserPublic.model_validate(user), csrf_token=csrf_token)


@router.post("/logout")
def logout(
    response: Response,
    ctx: AuthContext = Depends(get_auth_context),
    _csrf: None = Depends(require_csrf),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    session_service.revoke_session(db, ctx.session)
    db.commit()
    session_service.clear_session_cookie(response)
    return {"status": "ok"}


@router.get("/me", response_model=AuthResponse)
def me(ctx: AuthContext = Depends(get_auth_context)) -> AuthResponse:
    """Who is logged in. Also returns the CSRF token, so the frontend can
    recover it after a page reload."""
    return AuthResponse(
        user=UserPublic.model_validate(ctx.user),
        csrf_token=ctx.session.csrf_token,
    )