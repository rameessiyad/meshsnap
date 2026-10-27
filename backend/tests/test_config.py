import pytest
from pydantic import ValidationError

from app.core.config import Settings

BASE = {
    "database_url": "postgresql+psycopg://user:pass@localhost:5432/db",
    "secret_key": "x" * 40,
}


def test_invite_only_requires_a_code() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **BASE, registration_mode="invite_only", invite_codes="")


def test_invite_only_rejects_short_codes() -> None:
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None, **BASE, registration_mode="invite_only", invite_codes="short"
        )


def test_invite_only_accepts_long_codes() -> None:
    settings = Settings(
        _env_file=None,
        **BASE,
        registration_mode="invite_only",
        invite_codes="abcdefghijkl, another-long-code",
    )
    assert settings.invite_code_list == ["abcdefghijkl", "another-long-code"]