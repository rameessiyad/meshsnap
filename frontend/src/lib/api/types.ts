export type JobStatus =
  | "pending"
  | "submitting"
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

const ACTIVE_STATUSES: JobStatus[] = [
  "pending",
  "submitting",
  "queued",
  "in_progress",
];

export function isActiveStatus(status: JobStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export interface Job {
  id: string;
  project_id: string;
  status: JobStatus;
  provider: string;
  model: string;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  cancel_requested_at: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  has_source_image: boolean;
  created_at: string;
  latest_job: Job | null;
  model_asset_id: string | null;
}

export interface Quota {
  used: number;
  limit: number;
  provider: string;
}