"use client";

import { Box } from "lucide-react";
import Link from "next/link";

import ProjectCard from "@/components/projects/ProjectCard";
import { useProjects } from "@/hooks/useProjects";
import { getErrorMessage } from "@/lib/api/errors";

import EmptyState from "./EmptyState";

export default function RecentProjects() {
  const { data: projects, isPending, error } = useProjects();

  return (
    <section aria-labelledby="recent-projects-title">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="recent-projects-title" className="text-lg font-semibold">
          Recent projects
        </h2>
        <Link
          href="/dashboard/projects"
          className="text-sm font-medium text-primary-text hover:underline"
        >
          View all
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
          description="Create your first project to see it here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 6).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}
