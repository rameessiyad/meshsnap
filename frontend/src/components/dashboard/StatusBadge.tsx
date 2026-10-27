import {
  CircleCheck,
  CircleX,
  Clock,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";

import type { JobStatus } from "./types";

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; icon: LucideIcon; classes: string; spin?: boolean }
> = {
  queued: {
    label: "Queued",
    icon: Clock,
    classes: "border-border bg-surface-raised text-muted-foreground",
  },
  processing: {
    label: "Processing",
    icon: LoaderCircle,
    classes: "border-warning/30 bg-warning/10 text-warning",
    spin: true,
  },
  succeeded: {
    label: "Completed",
    icon: CircleCheck,
    classes: "border-success/30 bg-primary-subtle text-success",
  },
  failed: {
    label: "Failed",
    icon: CircleX,
    classes: "border-danger/30 bg-danger-subtle text-danger",
  },
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${config.classes}`}
    >
      <Icon
        className={`size-3.5 ${config.spin ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
