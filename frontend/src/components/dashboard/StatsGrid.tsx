"use client";

import { Box, FolderOpen, Gauge, Loader } from "lucide-react";

import { useProjects, useQuota } from "@/hooks/useProjects";
import { isActiveStatus } from "@/lib/api/types";

import StatCard from "./StatCard";

export default function StatsGrid() {
  const projects = useProjects();
  const quota = useQuota();
  const list = projects.data;

  const running = list
    ? list.filter((p) => p.latest_job && isActiveStatus(p.latest_job.status))
        .length
    : null;
  const ready = list ? list.filter((p) => p.model_asset_id).length : null;

  return (
    <section
      aria-label="Overview"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      <StatCard
        icon={FolderOpen}
        label="Projects"
        value={list ? String(list.length) : "–"}
        caption="In your account"
      />
      <StatCard
        icon={Box}
        label="Models ready"
        value={ready === null ? "–" : String(ready)}
        caption="Downloadable GLB files"
      />
      <StatCard
        icon={Loader}
        label="Generating now"
        value={running === null ? "–" : String(running)}
        caption="Running right now"
      />
      <StatCard
        icon={Gauge}
        label="Used today"
        value={quota.data ? `${quota.data.used} / ${quota.data.limit}` : "–"}
        caption="Daily generation limit (UTC)"
      />
    </section>
  );
}