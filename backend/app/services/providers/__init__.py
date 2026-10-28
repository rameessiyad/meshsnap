from app.core.config import get_settings
from app.services.providers.base import GenerationProvider


def get_provider() -> GenerationProvider:
    settings = get_settings()
    if settings.generation_provider == "fal":
        from app.services.providers.fal import FalHunyuan3DProvider

        return FalHunyuan3DProvider(settings.fal_key)

    from app.services.providers.mock import MockProvider

    return MockProvider()