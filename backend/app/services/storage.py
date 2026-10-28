"""File storage. Local disk for development, Cloudinary for sharing/production.

Images are stored as Cloudinary 'image' resources, GLB models as 'raw' resources.
"""

import io
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from app.core.config import BACKEND_DIR, get_settings

FileKind = Literal["image", "model"]


@dataclass(frozen=True)
class StoredFile:
    url: str
    storage_provider: str  # "local" or "cloudinary"
    storage_key: str  # relative path (local) or public_id (cloudinary)


class StorageError(Exception):
    pass


def local_storage_root() -> Path:
    root = Path(get_settings().local_storage_dir)
    if not root.is_absolute():
        root = BACKEND_DIR / root
    return root


def _configure_cloudinary() -> None:
    import cloudinary

    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def save_file(data: bytes, user_id: uuid.UUID, kind: FileKind, extension: str) -> StoredFile:
    """Store bytes and return where they live. extension includes the dot, e.g. '.png'."""
    settings = get_settings()
    name = f"{uuid.uuid4().hex}{extension}"

    if settings.storage_backend == "local":
        key = f"{user_id}/{kind}/{name}"
        path = local_storage_root() / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        url = f"{settings.backend_public_url.rstrip('/')}/media/{key}"
        return StoredFile(url=url, storage_provider="local", storage_key=key)

    import cloudinary.uploader

    _configure_cloudinary()
    try:
        if kind == "image":
            public_id = f"meshsnap/{user_id}/image/{uuid.uuid4().hex}"
            result = cloudinary.uploader.upload(
                io.BytesIO(data), public_id=public_id, resource_type="image"
            )
        else:
            # Raw resources keep the extension as part of the public_id.
            public_id = f"meshsnap/{user_id}/model/{name}"
            result = cloudinary.uploader.upload(
                io.BytesIO(data), public_id=public_id, resource_type="raw"
            )
    except Exception as exc:
        raise StorageError("Could not upload the file to storage") from exc

    return StoredFile(
        url=result["secure_url"],
        storage_provider="cloudinary",
        storage_key=result["public_id"],
    )


def delete_file(storage_provider: str, storage_key: str, kind: FileKind) -> None:
    """Best-effort delete. Never raises, so deleting a project always succeeds."""
    try:
        if storage_provider == "local":
            root = local_storage_root().resolve()
            path = (root / storage_key).resolve()
            # Safety: never delete anything outside the storage folder.
            if root in path.parents and path.is_file():
                path.unlink()
            return

        import cloudinary.uploader

        _configure_cloudinary()
        cloudinary.uploader.destroy(
            storage_key, resource_type="image" if kind == "image" else "raw"
        )
    except Exception:
        pass