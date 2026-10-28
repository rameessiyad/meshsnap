import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.generation import JobPublic


def _clean_name(value: object) -> object:
    if value is None:
        raise ValueError("Name cannot be empty")
    return value.strip() if isinstance(value, str) else value


def _blank_to_none(value: object) -> object:
    if isinstance(value, str):
        return value.strip() or None
    return value


class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)

    _name = field_validator("name", mode="before")(_clean_name)
    _description = field_validator("description", mode="before")(_blank_to_none)


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)

    _name = field_validator("name", mode="before")(_clean_name)
    _description = field_validator("description", mode="before")(_blank_to_none)


class ProjectPublic(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    has_source_image: bool
    created_at: datetime
    latest_job: JobPublic | None
    # Download with GET /api/assets/{model_asset_id}/file
    model_asset_id: uuid.UUID | None