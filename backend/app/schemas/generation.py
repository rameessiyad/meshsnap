import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JobPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    status: str
    provider: str
    model: str
    error_code: str | None
    error_message: str | None
    created_at: datetime
    submitted_at: datetime | None
    completed_at: datetime | None
    cancel_requested_at: datetime | None


class QuotaPublic(BaseModel):
    used: int
    limit: int
    provider: str
    
class VersionPublic(BaseModel):
    asset_id: uuid.UUID
    job_id: uuid.UUID
    version: int
    is_latest: bool
    size_bytes: int
    created_at: datetime