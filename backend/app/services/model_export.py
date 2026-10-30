"""Convert a GLB into other formats (OBJ, STL) for download."""

import io


class ExportError(Exception):
    pass


def convert_glb(data: bytes, fmt: str) -> tuple[bytes, str]:
    """Returns (file bytes, content type) for fmt in glb, obj, stl."""
    if fmt == "glb":
        return data, "model/gltf-binary"
    if fmt not in ("obj", "stl"):
        raise ExportError("Unsupported format")

    try:
        import trimesh

        mesh = trimesh.load(io.BytesIO(data), file_type="glb", force="mesh")
        if not isinstance(mesh, trimesh.Trimesh) or len(mesh.faces) == 0:
            raise ExportError("The model has no mesh data")

        out = mesh.export(file_type=fmt)
        if isinstance(out, str):
            out = out.encode("utf-8")
    except ExportError:
        raise
    except Exception as exc:
        raise ExportError("Could not convert the model") from exc

    return out, ("model/obj" if fmt == "obj" else "model/stl")