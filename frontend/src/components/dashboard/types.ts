export type JobStatus = "queued" | "processing" | "succeeded" | "failed";

export type Project = {
  id: string;
  name: string;
  status: JobStatus;
  createdAt: string; // ISO date string
};

export type GenerationJob = {
  id: string;
  projectName: string;
  status: JobStatus;
  createdAt: string; // ISO date string
  message?: string; // optional short note, e.g. why a job failed
};
