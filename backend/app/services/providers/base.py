from abc import ABC, abstractmethod
from dataclasses import dataclass


class ProviderError(Exception):
    """Raised when the 3D provider fails. The message is safe to show the user."""


@dataclass(frozen=True)
class GenerationOutput:
    glb_bytes: bytes
    provider_job_id: str | None = None


class GenerationProvider(ABC):
    name: str  # e.g. "mock", "fal"
    model_name: str  # e.g. "fal-ai/hunyuan3d/v2"

    @abstractmethod
    def generate(self, image_url: str) -> GenerationOutput:
        """Turn the image at image_url into a GLB model. Blocking call."""