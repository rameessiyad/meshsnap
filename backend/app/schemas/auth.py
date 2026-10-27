import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

MIN_PASSWORD_LENGTH = 10
# The upper limit stops someone sending a huge "password" to waste CPU on hashing.
MAX_PASSWORD_LENGTH = 128


def _clean_email(value: object) -> object:
    """Trim and lowercase, so A@x.com and a@x.com are the same account."""
    if isinstance(value, str):
        return value.strip().lower()
    return value


class RegisterRequest(BaseModel):
    # Unknown fields (for example "role": "admin") are rejected, not ignored.
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)
    display_name: str | None = Field(default=None, max_length=100)
    # Only used when REGISTRATION_MODE=invite_only.
    invite_code: str | None = Field(default=None, max_length=100)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return _clean_email(value)

    @field_validator("password")
    @classmethod
    def password_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Password cannot be only whitespace")
        return value

    @field_validator("display_name", "invite_code", mode="before")
    @classmethod
    def blank_to_none(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    # No minimum length here: login should not reveal password rules.
    password: str = Field(min_length=1, max_length=MAX_PASSWORD_LENGTH)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return _clean_email(value)


class UserPublic(BaseModel):
    """The only user fields the API ever returns. No password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    display_name: str | None
    role: str
    created_at: datetime


class AuthResponse(BaseModel):
    user: UserPublic
    # The frontend sends this back in the X-CSRF-Token header on write requests.
    csrf_token: str