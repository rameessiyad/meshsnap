import { Box } from "lucide-react";
import Link from "next/link";

import JobStatusBadge from "@/components/dashboard/JobStatusBadge";
import RelativeTime from "@/components/dashboard/RelativeTime";
import type { Project } from "@/lib/api/types";

import ProjectImage from "./ProjectImage";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="landing-feature-card group overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-colors hover:border-primary/50"
    >
      <div className="aspect-[4/3] overflow-hidden bg-surface-raised">
        {project.has_source_image ? (
          <ProjectImage projectId={project.id} alt={project.name} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Box className="size-8" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">{project.name}</h3>
          {project.latest_job ? (
            <JobStatusBadge status={project.latest_job.status} />
          ) : (
            <span className="shrink-0 text-xs text-muted-foreground">
              No model yet
            </span>
          )}
        </div>
        <p className="min-h-4 text-xs text-muted-foreground">
          <RelativeTime iso={project.created_at} />
        </p>
      </div>
    </Link>
  );
}
