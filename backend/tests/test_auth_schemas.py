import pytest
from pydantic import ValidationError

from app.schemas.auth import LoginRequest, RegisterRequest, UserPublic


def test_register_normalizes_email_and_display_name() -> None:
    data = RegisterRequest(
        email="  Tester@Gmail.COM ",
        password="CorrectHorse1",
        display_name="  Ram  ",
    )
    assert data.email == "tester@gmail.com"
    assert data.display_name == "Ram"


def test_register_blank_display_name_becomes_none() -> None:
    data = RegisterRequest(
        email="tester@gmail.com",
        password="CorrectHorse1",
        display_name="   ",
    )
    assert data.display_name is None


@pytest.mark.parametrize(
    "payload",
    [
        {"email": "not-an-email", "password": "CorrectHorse1"},
        {"email": "tester@gmail.com", "password": "short"},
        {"email": "tester@gmail.com", "password": " " * 12},
        {"email": "tester@gmail.com", "password": "x" * 129},
        {"email": "tester@gmail.com", "password": "CorrectHorse1", "role": "admin"},
    ],
)
def test_register_rejects_invalid_input(payload: dict[str, str]) -> None:
    with pytest.raises(ValidationError):
        RegisterRequest(**payload)


def test_login_normalizes_email() -> None:
    data = LoginRequest(email=" TESTER@Gmail.com", password="x")
    assert data.email == "tester@gmail.com"


def test_login_rejects_oversized_password() -> None:
    with pytest.raises(ValidationError):
        LoginRequest(email="tester@gmail.com", password="x" * 129)


def test_user_public_hides_password_hash() -> None:
    assert "password_hash" not in UserPublic.model_fields