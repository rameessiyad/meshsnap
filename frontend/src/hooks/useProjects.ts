"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { cancelJob, getQuota, startGeneration } from "@/lib/api/generation";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  uploadProjectImage,
} from "@/lib/api/projects";
import { isActiveStatus, type Project } from "@/lib/api/types";

const QUOTA_KEY = ["usage", "today"] as const;

export const projectKeys = {
  all: ["projects", "list"] as const,
  detail: (id: string) => ["projects", "detail", id] as const,
};

function hasActiveJob(project: Project | undefined): boolean {
  return !!project?.latest_job && isActiveStatus(project.latest_job.status);
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: listProjects,
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

export function useQuota() {
  return useQuery({ queryKey: QUOTA_KEY, queryFn: getQuota });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
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