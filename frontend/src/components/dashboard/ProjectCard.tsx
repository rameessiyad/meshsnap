import { Box } from "lucide-react";

import RelativeTime from "./RelativeTime";
import StatusBadge from "./StatusBadge";
import type { Project } from "./types";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="landing-feature-card overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      {/* Placeholder thumbnail: swap for the real preview image later */}
      <div className="flex h-36 items-center justify-center bg-linear-to-br from-primary-subtle via-surface-raised to-surface">
        <Box className="size-10 text-primary-text" aria-hidden="true" />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-sm font-semibold">
            {project.name}
          </h3>
          <StatusBadge status={project.status} />
        </div>
        <p className="min-h-4 text-xs text-muted-foreground">
          <RelativeTime iso={project.createdAt} />
        </p>
      </div>
    </article>
  );
}
