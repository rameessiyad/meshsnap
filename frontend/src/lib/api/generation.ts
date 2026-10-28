import { apiClient } from "./client";
import type { Job, Quota } from "./types";

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

export async function fetchAssetBlob(assetId: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/assets/${assetId}/file`, {
    responseType: "blob",
    timeout: 120_000,
  });
  return data;
}

export async function downloadAsset(
  assetId: string,
  filename: string,
): Promise<void> {
  const data = await fetchAssetBlob(assetId);
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}