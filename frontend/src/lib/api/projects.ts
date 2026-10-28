import { apiClient } from "./client";
import type { Project } from "./types";

export async function listProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>("/projects");
  return data;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await apiClient.get<Project>(`/projects/${id}`);
  return data;
}

export async function createProject(input: {
  name: string;
  description?: string | null;
}): Promise<Project> {
  const { data } = await apiClient.post<Project>("/projects", input);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}

export async function uploadProjectImage(
  id: string,
  file: File,
): Promise<Project> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<Project>(
    `/projects/${id}/image`,
    form,
    {
      timeout: 60_000,
      // Must not be JSON, or axios would convert the FormData into JSON.
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data;
}

export async function fetchProjectImage(id: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/projects/${id}/image`, {
    responseType: "blob",
  });
  return data;
}