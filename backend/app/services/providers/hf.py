import logging
import tempfile
from pathlib import Path
from typing import Any

from app.services.providers.base import GenerationOutput, GenerationProvider, ProviderError

logger = logging.getLogger(__name__)

_SUFFIXES = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}


def _friendly_error(exc: Exception) -> str:
    text = str(exc).lower()
    if "quota" in text or "gpu" in text:
        return "The free 3D service has reached its GPU limit. Please try again later."
    if "timeout" in text or "timed out" in text:
        return "The free 3D service took too long to respond. Please try again."
    return "The free 3D service is busy or unavailable. Please try again later."


def _extract_path(result: Any) -> str:
    first = result[0] if isinstance(result, (list, tuple)) and result else result
    if isinstance(first, dict):
        first = first.get("value", first)
    if isinstance(first, dict):
        first = first.get("path")
    if not isinstance(first, str) or not first:
        raise ProviderError("The 3D service returned no model")
    return first


class HuggingFaceSpaceProvider(GenerationProvider):
    """Free image-to-3D through a public Hugging Face Space (gradio_client).

    Free Spaces have GPU quotas and can sleep, so failures here are expected
    sometimes and are reported as friendly errors.
    """

    name = "hf"

    def __init__(self, space_id: str, token: str) -> None:
        self._space_id = space_id
        self._token = token or None
        self.model_name = space_id

    def _connect(self) -> Any:
        from gradio_client import Client

        try:
            return Client(self._space_id, token=self._token)
        except TypeError:
            # Older gradio_client versions call the argument hf_token.
            return Client(self._space_id, hf_token=self._token)

    def generate(self, image_bytes: bytes, content_type: str) -> GenerationOutput:
        from gradio_client import handle_file

        suffix = _SUFFIXES.get(content_type, ".png")
        with tempfile.TemporaryDirectory() as tmp:
            image_path = Path(tmp) / f"input{suffix}"
            image_path.write_bytes(image_bytes)

            try:
                client = self._connect()
                job = client.submit(
                    image=handle_file(str(image_path)),
                    caption=None,
                    mv_image_front=None,
                    mv_image_back=None,
                    mv_image_left=None,
                    mv_image_right=None,
                    steps=30,
                    guidance_scale=5.0,
                    seed=1234,
                    octree_resolution=256,
                    check_box_rembg=True,
                    num_chunks=8000,
                    randomize_seed=True,
                    api_name="/shape_generation",
                )
                result = job.result(timeout=300)
                glb_path = _extract_path(result)
                data = Path(glb_path).read_bytes()
            except ProviderError:
                raise
            except Exception as exc:
                logger.warning("HF provider error: %s", str(exc)[:300])
                raise ProviderError(_friendly_error(exc)) from exc

        if not data:
            raise ProviderError("The 3D service returned an empty model")
        return GenerationOutput(glb_bytes=data)