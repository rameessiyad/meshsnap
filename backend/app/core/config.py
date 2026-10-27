from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator
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

    # Database
    database_url: str

    # Security
    secret_key: str

    # Sessions
    session_cookie_name: str = "meshsnap_session"
    session_ttl_hours: int = 168

    # Access control
    registration_mode: Literal["open", "invite_only", "closed"] = "open"

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