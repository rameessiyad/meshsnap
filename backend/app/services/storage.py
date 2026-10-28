"""Private file storage. Files are never public: every download goes through
an API route that checks ownership first.

Local disk for development, Cloudinary (type 'authenticated') otherwise.
"""

import io
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import httpx

from app.core.config import BACKEND_DIR, get_settings

import logging

logger = logging.getLogger(__name__)

FileKind = Literal["image", "model"]


class StorageError(Exception):
    pass


@dataclass(frozen=True)
class StoredFile:
    backend: str  # "local" or "cloudinary"
    key: str  # relative path (local) or public_id (cloudinary)

    @property
    def ref(self) -> str:
        """Single string form, e.g. 'local:<key>'. Used by projects.source_image_key."""
        return f"{self.backend}:{self.key}"


def parse_ref(ref: str) -> tuple[str, str]:
    backend, _, key = ref.partition(":")
    if backend not in ("local", "cloudinary") or not key:
        raise StorageError("Invalid storage reference")
    return backend, key


def local_storage_root() -> Path:
    root = Path(get_settings().local_storage_dir)
    if not root.is_absolute():
        root = BACKEND_DIR / root
    return root


def _safe_local_path(key: str) -> Path:
    root = local_storage_root().resolve()
    path = (root / key).resolve()
    # Never read or delete anything outside the storage folder.
    if root not in path.parents:
        raise StorageError("Invalid storage key")
    return path


def _configure_cloudinary() -> None:
    import cloudinary

    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def _resource_type(kind: FileKind) -> str:
    return "image" if kind == "image" else "raw"


def save_file(data: bytes, user_id: uuid.UUID, kind: FileKind, extension: str) -> StoredFile:
    """Store bytes privately. extension includes the dot, e.g. '.png'."""
    settings = get_settings()
    name = uuid.uuid4().hex

    if settings.storage_backend == "local":
        key = f"{user_id}/{kind}/{name}{extension}"
        path = _safe_local_path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return StoredFile(backend="local", key=key)

    import cloudinary.uploader

    _configure_cloudinary()
    # Raw resources keep the extension inside the public_id; images do not.
    public_id = f"meshsnap/{user_id}/{kind}/{name}"
    if kind == "model":
        public_id += extension
    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(data),
            public_id=public_id,
            resource_type=_resource_type(kind),
            type="authenticated",
            overwrite=False,
        )
    except Exception as exc:
        logger.exception("Cloudinary upload failed")
        raise StorageError("Could not upload the file to storage") from exc

    return StoredFile(backend="cloudinary", key=result["public_id"])


def read_file(backend: str, key: str, kind: FileKind) -> bytes:
    if backend == "local":
        try:
            return _safe_local_path(key).read_bytes()
        except FileNotFoundError as exc:
            raise StorageError("File not found") from exc

    import cloudinary.utils

    _configure_cloudinary()
    try:
        url, _ = cloudinary.utils.cloudinary_url(
            key,
            resource_type=_resource_type(kind),
            type="authenticated",
            sign_url=True,
            secure=True,
        )
        response = httpx.get(url, timeout=60, follow_redirects=True)
        response.raise_for_status()
    except Exception as exc:
        raise StorageError("Could not read the file from storage") from exc
    return response.content


def delete_file(backend: str, key: str, kind: FileKind) -> None:
    """Best-effort delete. Never raises, so deleting a project always succeeds."""
    try:
        if backend == "local":
            path = _safe_local_path(key)
            if path.is_file():
                path.unlink()
            return

        import cloudinary.uploader

        _configure_cloudinary()
        cloudinary.uploader.destroy(
            key, resource_type=_resource_type(kind), type="authenticated"
        )
    except Exception:
        pass