import { CircleCheck, FolderOpen, LoaderCircle, Zap } from "lucide-react";

import { DAILY_LIMIT, generationsToday, jobs, projects } from "./mock-data";
import StatCard from "./StatCard";

export default function StatsGrid() {
  const completed = projects.filter(
    (project) => project.status === "succeeded",
  ).length;
  const inProgress = jobs.filter(
    (job) => job.status === "queued" || job.status === "processing",
  ).length;

  return (
    <section
      aria-label="Overview statistics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        icon={FolderOpen}
        label="Projects"
        value={String(projects.length)}
        caption="Total projects"
      />
      <StatCard
        icon={Zap}
        label="Generations today"
        value={`${generationsToday} / ${DAILY_LIMIT}`}
        caption="Daily limit (placeholder)"
      />
      <StatCard
        icon={CircleCheck}
        label="Completed models"
        value={String(completed)}
        caption="Ready to preview"
      />
      <StatCard
        icon={LoaderCircle}
        label="Processing now"
        value={String(inProgress)}
        caption="In queue or running"
      />
    </section>
  );
}
