import httpx

from app.services.providers.base import GenerationOutput, GenerationProvider, ProviderError


class FalHunyuan3DProvider(GenerationProvider):
    name = "fal"
    model_name = "fal-ai/hunyuan3d/v2"

    def __init__(self, api_key: str) -> None:
        import fal_client

        self._client = fal_client.SyncClient(key=api_key)

    def generate(self, image_bytes: bytes, content_type: str) -> GenerationOutput:
        try:
            image_url = self._client.upload(image_bytes, content_type)
            result = self._client.subscribe(
                self.model_name, arguments={"input_image_url": image_url}
            )
        except Exception as exc:
            raise ProviderError("The 3D provider request failed") from exc

        model_url = (result.get("model_mesh") or {}).get("url")
        if not model_url:
            raise ProviderError("The 3D provider returned no model")

        try:
            response = httpx.get(model_url, timeout=120, follow_redirects=True)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ProviderError("Could not download the generated model") from exc

        return GenerationOutput(glb_bytes=response.content)