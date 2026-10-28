"use client";

import { Box, Plus } from "lucide-react";
import Link from "next/link";

import EmptyState from "@/components/dashboard/EmptyState";
import { useProjects } from "@/hooks/useProjects";
import { getErrorMessage } from "@/lib/api/errors";

import ProjectCard from "./ProjectCard";

export default function ProjectsOverview() {
  const { data: projects, isPending, error } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="landing-button inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>New project</span>
        </Link>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-60 animate-pulse rounded-2xl bg-surface-raised"
            />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-400">
          {getErrorMessage(error)}
        </p>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No projects yet"
          description="Create a project from a photo to generate your first 3D model."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
