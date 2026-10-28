from abc import ABC, abstractmethod
from dataclasses import dataclass


class ProviderError(Exception):
    """Raised when the 3D provider fails. The message is safe to show the user."""


@dataclass(frozen=True)
class GenerationOutput:
    glb_bytes: bytes
    provider_job_id: str | None = None


class GenerationProvider(ABC):
    name: str  # "mock", "hf", "fal"
    model_name: str

    @abstractmethod
    def generate(self, image_bytes: bytes, content_type: str) -> GenerationOutput:
        """Turn the image into a GLB model. Blocking call."""