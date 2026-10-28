import struct
import uuid
from types import SimpleNamespace

import pytest

from app.services import storage
from app.services.image_validation import InvalidImageError, validate_image_upload
from app.services.providers.mock import build_cube_glb

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 32


def test_valid_png_is_accepted() -> None:
    assert validate_image_upload(PNG, 1024) == ("image/png", ".png")


def test_non_image_is_rejected() -> None:
    with pytest.raises(InvalidImageError):
        validate_image_upload(b"this is not an image", 1024)


def test_empty_file_is_rejected() -> None:
    with pytest.raises(InvalidImageError):
        validate_image_upload(b"", 1024)


def test_too_large_file_is_rejected() -> None:
    with pytest.raises(InvalidImageError):
        validate_image_upload(PNG, 10)


def test_mock_glb_has_valid_header() -> None:
    data = build_cube_glb()
    magic, version, length = struct.unpack("<III", data[:12])
    assert magic == 0x46546C67  # "glTF"
    assert version == 2
    assert length == len(data)


def test_parse_ref() -> None:
    assert storage.parse_ref("local:abc/def.png") == ("local", "abc/def.png")
    with pytest.raises(storage.StorageError):
        storage.parse_ref("ftp:whatever")
    with pytest.raises(storage.StorageError):
        storage.parse_ref("local:")


def test_local_storage_roundtrip(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(
        storage,
        "get_settings",
        lambda: SimpleNamespace(storage_backend="local", local_storage_dir=str(tmp_path)),
    )
    stored = storage.save_file(b"abc", uuid.uuid4(), "image", ".png")
    assert stored.backend == "local"
    assert storage.read_file(stored.backend, stored.key, "image") == b"abc"

    storage.delete_file(stored.backend, stored.key, "image")
    with pytest.raises(storage.StorageError):
        storage.read_file(stored.backend, stored.key, "image")


def test_local_storage_blocks_path_traversal(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(
        storage,
        "get_settings",
        lambda: SimpleNamespace(storage_backend="local", local_storage_dir=str(tmp_path)),
    )
    with pytest.raises(storage.StorageError):
        storage.read_file("local", "../secret.txt", "image")