"""Validate uploaded images by their real content, not the filename or the
Content-Type header (both of which the client controls)."""

ALLOWED_TYPES: dict[str, str] = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}


class InvalidImageError(ValueError):
    pass


def detect_image_type(data: bytes) -> str | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def validate_image_upload(data: bytes, max_bytes: int) -> tuple[str, str]:
    """Return (content_type, extension) or raise InvalidImageError."""
    if not data:
        raise InvalidImageError("The uploaded file is empty")
    if len(data) > max_bytes:
        raise InvalidImageError(
            f"The image is too large (maximum {max_bytes // (1024 * 1024)} MB)"
        )
    content_type = detect_image_type(data)
    if content_type is None:
        raise InvalidImageError("Only PNG, JPEG or WebP images are allowed")
    return content_type, ALLOWED_TYPES[content_type]