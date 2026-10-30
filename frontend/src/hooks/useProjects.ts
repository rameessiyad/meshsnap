"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  cancelJob,
  deleteVersion,
  getQuota,
  listVersions,
  startGeneration,
} from "@/lib/api/generation";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  uploadProjectImage,
  uploadThumbnail,
} from "@/lib/api/projects";
import { isActiveStatus, type Project } from "@/lib/api/types";

const QUOTA_KEY = ["usage", "today"] as const;

export const projectKeys = {
  all: ["projects", "list"] as const,
  list: (q: string) => ["projects", "list", q] as const,
  detail: (id: string) => ["projects", "detail", id] as const,
  versions: (id: string, latestAssetId: string | null) =>
    ["projects", "versions", id, latestAssetId] as const,
};

function hasActiveJob(project: Project | undefined): boolean {
  return !!project?.latest_job && isActiveStatus(project.latest_job.status);
}

export function useProjects(q = "") {
  const term = q.trim();
  return useQuery({
    queryKey: projectKeys.list(term),
    queryFn: () => listProjects(term || undefined),
    // Keep showing the old list while a new search loads.
    placeholderData: keepPreviousData,
    // Keep polling while any project is generating.
    refetchInterval: (query) =>
      query.state.data?.some(hasActiveJob) ? 3000 : false,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProject(id),
    retry: false,
    refetchInterval: (query) => (hasActiveJob(query.state.data) ? 2500 : false),
  });
}

export function useVersions(projectId: string, latestAssetId: string | null) {
  return useQuery({
    // The latest asset id is part of the key, so a new model refetches the list.
    queryKey: projectKeys.versions(projectId, latestAssetId),
    queryFn: () => listVersions(projectId),
    enabled: !!latestAssetId,
  });
}

export function useQuota() {
  return useQuery({ queryKey: QUOTA_KEY, queryFn: getQuota });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name?: string; description?: string | null };
    }) => updateProject(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, file }: { projectId: string; file: File }) =>
      uploadProjectImage(projectId, file),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["project-image", projectId],
      });
    },
  });
}

export function useUploadThumbnail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, blob }: { projectId: string; blob: Blob }) =>
      uploadThumbnail(projectId, blob),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useGenerate() {
  const queryClient = useQueryClient();
  return useMutation({
    // A fresh key per click: a double-click or retry of the same click is
    // answered with the same job instead of creating a second one.
    mutationFn: (projectId: string) =>
      startGeneration(projectId, crypto.randomUUID()),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: QUOTA_KEY });
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelJob,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: QUOTA_KEY });
    },
  });
}

export function useDeleteVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVersion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: QUOTA_KEY });
    },
  });
}
