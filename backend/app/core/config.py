from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> parents[2] is the backend folder
BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Application settings, loaded from environment variables and backend/.env."""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_env: Literal["development", "production", "test"] = "development"
    app_name: str = "MeshSnap"
    frontend_origin: str = "http://localhost:3000"
    # Public URL of this API. Used to build links to locally stored files.
    backend_public_url: str = "http://localhost:8000"

    # Database
    database_url: str

    # Security
    secret_key: str

    # Sessions
    session_cookie_name: str = "meshsnap_session"
    session_ttl_hours: int = 168

    # Access control
    registration_mode: Literal["open", "invite_only", "closed"] = "open"
    # Comma-separated list of valid invite codes (used when invite_only).
    invite_codes: str = ""

    # Login rate limits. A failed login counts against both the
    # (IP + email) pair and the IP alone.
    login_max_attempts: int = Field(default=5, ge=1)
    login_max_attempts_per_ip: int = Field(default=20, ge=1)
    login_window_seconds: int = Field(default=900, ge=1)

    # Registration rate limit, per IP.
    register_max_attempts: int = Field(default=10, ge=1)
    register_window_seconds: int = Field(default=3600, ge=1)

    # File storage
    storage_backend: Literal["local", "cloudinary"] = "local"
    local_storage_dir: str = "storage"
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    max_upload_mb: int = Field(default=10, ge=1, le=50)

    # 3D generation
    generation_provider: Literal["mock", "hf", "fal"] = "mock"
    fal_key: str = ""
    hf_token: str = ""
    hf_space_id: str = "tencent/Hunyuan3D-2"
    # Max generations per user per UTC day (finished plus currently running).
    daily_generation_limit: int = Field(default=10, ge=1)

    @field_validator("secret_key")
    @classmethod
    def secret_key_must_be_strong(cls, value: str) -> str:
        if value == "change-me" or len(value) < 32:
            raise ValueError(
                "SECRET_KEY must be set to a random value of at least 32 characters"
            )
        return value

    @field_validator("database_url")
    @classmethod
    def database_url_must_use_psycopg(cls, value: str) -> str:
        if not value.startswith("postgresql+psycopg://"):
            raise ValueError("DATABASE_URL must start with postgresql+psycopg://")
        return value

    @model_validator(mode="after")
    def invite_codes_required_for_invite_only(self) -> "Settings":
        if self.registration_mode == "invite_only":
            codes = self.invite_code_list
            if not codes or any(len(code) < 12 for code in codes):
                raise ValueError(
                    "INVITE_CODES must contain at least one code of 12 or more "
                    "characters when REGISTRATION_MODE=invite_only"
                )
        return self

    @model_validator(mode="after")
    def storage_and_provider_must_be_configured(self) -> "Settings":
        if self.storage_backend == "cloudinary" and not (
            self.cloudinary_cloud_name
            and self.cloudinary_api_key
            and self.cloudinary_api_secret
        ):
            raise ValueError(
                "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET "
                "are required when STORAGE_BACKEND=cloudinary"
            )
        if self.generation_provider == "fal" and not self.fal_key:
            raise ValueError("FAL_KEY is required when GENERATION_PROVIDER=fal")
        return self

    @property
    def invite_code_list(self) -> list[str]:
        return [code.strip() for code in self.invite_codes.split(",") if code.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cookie_secure(self) -> bool:
        # Cookies are Secure-only in production, so local http://localhost still works
        return self.is_production


@lru_cache
def get_settings() -> Settings:
    return Settings()