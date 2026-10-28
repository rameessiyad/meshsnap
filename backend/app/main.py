from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.core.config import get_settings
from app.services.storage import local_storage_root

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    # Interactive API docs are only exposed in development.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/openapi.json",
)

# Only the configured frontend may call the API from a browser.
# allow_credentials is required so the session cookie is sent.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

# Locally stored uploads and models (development). File names are random UUIDs.
if settings.storage_backend == "local":
    _media_root = local_storage_root()
    _media_root.mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=_media_root), name="media")