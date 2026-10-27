import { Box, ListChecks } from "lucide-react";

import EmptyState from "./EmptyState";
import { jobs } from "./mock-data";
import RelativeTime from "./RelativeTime";
import StatusBadge from "./StatusBadge";

export default function JobList() {
  const recent = jobs.slice(0, 6);

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
          {recent.map((job) => (
            <li
              key={job.id}
              className="flex items-center gap-3 px-4 py-3 sm:px-5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-muted-foreground">
                <Box className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {job.projectName}
                </p>
                <p className="min-h-4 truncate text-xs text-muted-foreground">
                  <RelativeTime iso={job.createdAt} />
                  {job.message ? ` · ${job.message}` : ""}
                </p>
              </div>
              <StatusBadge status={job.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
