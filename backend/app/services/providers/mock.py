import json
import struct
import time

from app.services.providers.base import GenerationOutput, GenerationProvider


def build_cube_glb() -> bytes:
    """Build a small green cube as a valid binary glTF (GLB) file."""
    vertices = [
        (-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1),
        (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1),
    ]
    indices = [
        0, 3, 2, 0, 2, 1,  # -Z
        4, 5, 6, 4, 6, 7,  # +Z
        0, 1, 5, 0, 5, 4,  # -Y
        3, 7, 6, 3, 6, 2,  # +Y
        0, 4, 7, 0, 7, 3,  # -X
        1, 2, 6, 1, 6, 5,  # +X
    ]

    positions_bin = b"".join(struct.pack("<3f", *v) for v in vertices)  # 96 bytes
    indices_bin = struct.pack(f"<{len(indices)}H", *indices)  # 72 bytes
    binary = positions_bin + indices_bin  # 168 bytes, already a multiple of 4

    gltf = {
        "asset": {"version": "2.0", "generator": "MeshSnap mock provider"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [
            {"primitives": [{"attributes": {"POSITION": 0}, "indices": 1, "material": 0}]}
        ],
        "materials": [
            {
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.2, 0.9, 0.4, 1.0],
                    "metallicFactor": 0.1,
                    "roughnessFactor": 0.6,
                },
                "doubleSided": True,
            }
        ],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": 8,
                "type": "VEC3",
                "min": [-1, -1, -1],
                "max": [1, 1, 1],
            },
            {"bufferView": 1, "componentType": 5123, "count": 36, "type": "SCALAR"},
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": 96, "target": 34962},
            {"buffer": 0, "byteOffset": 96, "byteLength": 72, "target": 34963},
        ],
        "buffers": [{"byteLength": len(binary)}],
    }

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_bytes += b" " * (-len(json_bytes) % 4)  # JSON chunk is padded with spaces

    total = 12 + 8 + len(json_bytes) + 8 + len(binary)
    return b"".join(
        [
            struct.pack("<III", 0x46546C67, 2, total),  # "glTF", version 2
            struct.pack("<II", len(json_bytes), 0x4E4F534A),  # JSON chunk
            json_bytes,
            struct.pack("<II", len(binary), 0x004E4942),  # BIN chunk
            binary,
        ]
    )


class MockProvider(GenerationProvider):
    """Fake provider for development: waits a few seconds, returns a cube."""

    name = "mock"
    model_name = "mock-cube"

    def __init__(self, delay_seconds: float = 4.0) -> None:
        self._delay = delay_seconds

    def generate(self, image_bytes: bytes, content_type: str) -> GenerationOutput:
        time.sleep(self._delay)
        # provider_job_id stays None: (provider, provider_request_id) is unique in the DB.
        return GenerationOutput(glb_bytes=build_cube_glb(), provider_job_id=None)
    """Fake provider for development: waits a few seconds, returns a cube."""

    name = "mock"
    model_name = "mock-cube"

    def __init__(self, delay_seconds: float = 4.0) -> None:
        self._delay = delay_seconds

    def generate(self, image_url: str) -> GenerationOutput:
        time.sleep(self._delay)
        return GenerationOutput(glb_bytes=build_cube_glb(), provider_job_id="mock-job")