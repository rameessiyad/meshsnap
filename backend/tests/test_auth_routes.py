import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api import auth as auth_module
from app.core.config import get_settings
from app.core.security import hash_password
from app.models.user import User
from app.services.rate_limiter import login_pair_limiter, register_limiter

EMAIL = "route-test@gmail.com"
PASSWORD = "CorrectHorse1"
settings = get_settings()


def register(client: TestClient, **overrides: str) -> "object":
    payload = {"email": EMAIL, "password": PASSWORD, **overrides}
    return client.post("/api/auth/register", json=payload)


def login(client: TestClient, password: str = PASSWORD, email: str = EMAIL) -> "object":
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_register_creates_user_and_session(client: TestClient) -> None:
    response = register(client, display_name="Tester")
    assert response.status_code == 201

    body = response.json()
    assert body["user"]["email"] == EMAIL
    assert body["user"]["role"] == "user"
    assert "password_hash" not in body["user"]
    assert len(body["csrf_token"]) >= 32
    assert client.cookies.get(settings.session_cookie_name)

    assert client.get("/api/auth/me").status_code == 200


def test_register_normalizes_email(client: TestClient) -> None:
    response = register(client, email="  Route-Test@GMAIL.com ")
    assert response.status_code == 201
    assert response.json()["user"]["email"] == EMAIL


def test_register_duplicate_email_is_rejected(client: TestClient) -> None:
    assert register(client).status_code == 201
    assert register(client).status_code == 409


def test_register_rejects_role_field(client: TestClient) -> None:
    response = register(client, role="admin")
    assert response.status_code == 422


def test_register_closed_mode(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    closed = get_settings().model_copy(update={"registration_mode": "closed"})
    monkeypatch.setattr(auth_module, "get_settings", lambda: closed)

    assert register(client).status_code == 403


def test_register_invite_only_mode(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    invite_only = get_settings().model_copy(
        update={
            "registration_mode": "invite_only",
            "invite_codes": "valid-invite-code-123",
        }
    )
    monkeypatch.setattr(auth_module, "get_settings", lambda: invite_only)

    assert register(client).status_code == 403
    assert register(client, invite_code="wrong-invite-code-999").status_code == 403
    assert register(client, invite_code="valid-invite-code-123").status_code == 201


def test_register_is_rate_limited(client: TestClient) -> None:
    for _ in range(register_limiter.max_attempts):
        register(client)  # first call succeeds, the rest are duplicates (409)

    response = register(client)
    assert response.status_code == 429
    assert int(response.headers["retry-after"]) > 0


def test_login_success(client: TestClient) -> None:
    register(client)
    client.cookies.clear()

    response = login(client)
    assert response.status_code == 200
    assert response.json()["user"]["email"] == EMAIL
    assert client.cookies.get(settings.session_cookie_name)


def test_login_wrong_password_and_unknown_email_look_identical(
    client: TestClient,
) -> None:
    register(client)
    client.cookies.clear()

    wrong_password = login(client, password="WrongPassword99")
    unknown_email = login(client, email="nobody-here@gmail.com")

    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_login_inactive_user_is_rejected(client: TestClient, db: Session) -> None:
    user = User(
        email=EMAIL,
        password_hash=hash_password(PASSWORD),
        is_active=False,
    )
    db.add(user)
    db.flush()

    response = login(client)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_is_rate_limited(client: TestClient) -> None:
    register(client)
    client.cookies.clear()

    for _ in range(login_pair_limiter.max_attempts):
        assert login(client, password="WrongPassword99").status_code == 401

    blocked = login(client, password="WrongPassword99")
    assert blocked.status_code == 429
    assert int(blocked.headers["retry-after"]) > 0

    # While blocked, even the correct password is refused.
    assert login(client).status_code == 429


def test_me_requires_login(client: TestClient) -> None:
    assert client.get("/api/auth/me").status_code == 401

    client.cookies.set(settings.session_cookie_name, "not-a-real-token")
    assert client.get("/api/auth/me").status_code == 401


def test_logout_requires_csrf_token(client: TestClient) -> None:
    register(client)

    assert client.post("/api/auth/logout").status_code == 403
    wrong = client.post("/api/auth/logout", headers={"X-CSRF-Token": "wrong-token"})
    assert wrong.status_code == 403

    # Still logged in after the rejected attempts.
    assert client.get("/api/auth/me").status_code == 200


def test_logout_rejects_wrong_origin(client: TestClient) -> None:
    csrf_token = register(client).json()["csrf_token"]

    response = client.post(
        "/api/auth/logout",
        headers={"X-CSRF-Token": csrf_token, "Origin": "http://evil.example"},
    )
    assert response.status_code == 403
    assert client.get("/api/auth/me").status_code == 200


def test_logout_revokes_session(client: TestClient) -> None:
    csrf_token = register(client).json()["csrf_token"]

    response = client.post(
        "/api/auth/logout",
        headers={"X-CSRF-Token": csrf_token, "Origin": settings.frontend_origin},
    )
    assert response.status_code == 200
    assert client.get("/api/auth/me").status_code == 401