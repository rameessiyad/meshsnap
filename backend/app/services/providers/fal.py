import httpx

from app.services.providers.base import GenerationOutput, GenerationProvider, ProviderError


class FalHunyuan3DProvider(GenerationProvider):
    name = "fal"
    model_name = "fal-ai/hunyuan3d/v2"

    def __init__(self, api_key: str) -> None:
        import fal_client

        self._client = fal_client.SyncClient(key=api_key)

    def generate(self, image_url: str) -> GenerationOutput:
        try:
            result = self._client.subscribe(
                self.model_name,
                arguments={"input_image_url": image_url},
            )
        except Exception as exc:
            raise ProviderError("The 3D provider request failed") from exc

        mesh = result.get("model_mesh") or {}
        model_url = mesh.get("url")
        if not model_url:
            raise ProviderError("The 3D provider returned no model")

        try:
            response = httpx.get(model_url, timeout=120, follow_redirects=True)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ProviderError("Could not download the generated model") from exc

        return GenerationOutput(glb_bytes=response.content, provider_job_id=None)