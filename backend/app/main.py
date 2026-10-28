import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.generation import router as generation_router
from app.api.health import router as health_router
from app.api.projects import router as projects_router
from app.core.config import get_settings
from app.services.generation_service import fail_interrupted_jobs

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Jobs that were running when the server stopped can never finish.
    try:
        count = fail_interrupted_jobs()
        if count:
            logger.warning("Marked %d interrupted generation job(s) as failed", count)
    except Exception:
        logger.exception("Could not clean up interrupted generation jobs")
    yield


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
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
    allow_headers=["Content-Type", "X-CSRF-Token", "Idempotency-Key"],
)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(generation_router, prefix="/api")