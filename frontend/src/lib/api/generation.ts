import { apiClient } from "./client";
import type { Job, ModelFormat, ModelVersion, Quota } from "./types";

export async function startGeneration(
  projectId: string,
  idempotencyKey: string,
): Promise<Job> {
  const { data } = await apiClient.post<Job>(
    `/projects/${projectId}/generate`,
    undefined,
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
  return data;
}

export async function cancelJob(jobId: string): Promise<Job> {
  const { data } = await apiClient.post<Job>(`/jobs/${jobId}/cancel`);
  return data;
}

export async function getQuota(): Promise<Quota> {
  const { data } = await apiClient.get<Quota>("/usage/today");
  return data;
}

export async function listVersions(projectId: string): Promise<ModelVersion[]> {
  const { data } = await apiClient.get<ModelVersion[]>(
    `/projects/${projectId}/versions`,
  );
  return data;
}

export async function deleteVersion(assetId: string): Promise<void> {
  await apiClient.delete(`/assets/${assetId}`);
}

export async function fetchAssetBlob(
  assetId: string,
  format: ModelFormat = "glb",
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/assets/${assetId}/file`, {
    responseType: "blob",
    timeout: 120_000,
    params: format === "glb" ? undefined : { format },
  });
  return data;
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAsset(
  assetId: string,
  filename: string,
  format: ModelFormat = "glb",
): Promise<void> {
  saveBlob(await fetchAssetBlob(assetId, format), filename);
}