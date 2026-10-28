"use client";

import { Box, ListChecks } from "lucide-react";
import Link from "next/link";

import { useProjects } from "@/hooks/useProjects";

import EmptyState from "./EmptyState";
import JobStatusBadge from "./JobStatusBadge";
import RelativeTime from "./RelativeTime";

export default function JobList() {
  const { data: projects } = useProjects();

  // Each project's latest job, newest first.
  const recent = (projects ?? [])
    .filter((p) => p.latest_job)
    .sort(
      (a, b) =>
        new Date(b.latest_job!.created_at).getTime() -
        new Date(a.latest_job!.created_at).getTime(),
    )
    .slice(0, 6);

  return (
    <section aria-labelledby="recent-jobs-title">
      <h2 id="recent-jobs-title" className="mb-4 text-lg font-semibold">
        Recent generation jobs
      </h2>

      {recent.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No generation jobs yet"
          description="Jobs you start will appear here with their live status."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          {recent.map((project) => {
            const job = project.latest_job!;
            return (
              <li key={job.id}>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised sm:px-5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-muted-foreground">
                    <Box className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {project.name}
                    </p>
                    <p className="min-h-4 truncate text-xs text-muted-foreground">
                      <RelativeTime iso={job.created_at} />
                      {job.status === "failed" && job.error_message
                        ? ` · ${job.error_message}`
                        : ""}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
