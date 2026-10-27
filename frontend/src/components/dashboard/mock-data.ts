import type { GenerationJob, Project } from "./types";

// Set to false to preview the empty states.
export const SHOW_SAMPLE_DATA = true;

// Placeholder for the daily generation limit.
export const DAILY_LIMIT = 5;

// NOTE: In a later stage, replace the arrays below with real API calls using
// @tanstack/react-query (for example useQuery for "/projects" and "/jobs").
// The components that show this data will then need "use client".
//
// The dates are fixed on purpose: Next.js does not allow reading the current
// time while prerendering. Real API data will have real dates anyway.

const SAMPLE_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Ceramic Mug",
    status: "processing",
    createdAt: "2026-10-27T10:50:00Z",
  },
  {
    id: "p2",
    name: "Wooden Chair",
    status: "queued",
    createdAt: "2026-10-27T10:56:00Z",
  },
  {
    id: "p3",
    name: "Retro Sneaker",
    status: "succeeded",
    createdAt: "2026-10-27T07:55:00Z",
  },
  {
    id: "p4",
    name: "Desk Lamp",
    status: "failed",
    createdAt: "2026-10-26T14:55:00Z",
  },
  {
    id: "p5",
    name: "Robot Toy",
    status: "succeeded",
    createdAt: "2026-10-25T10:00:00Z",
  },
  {
    id: "p6",
    name: "Garden Gnome",
    status: "succeeded",
    createdAt: "2026-10-22T10:00:00Z",
  },
];

const SAMPLE_JOBS: GenerationJob[] = [
  {
    id: "j1",
    projectName: "Wooden Chair",
    status: "queued",
    createdAt: "2026-10-27T10:56:00Z",
  },
  {
    id: "j2",
    projectName: "Ceramic Mug",
    status: "processing",
    createdAt: "2026-10-27T10:50:00Z",
  },
  {
    id: "j3",
    projectName: "Retro Sneaker",
    status: "succeeded",
    createdAt: "2026-10-27T07:55:00Z",
  },
  {
    id: "j4",
    projectName: "Desk Lamp",
    status: "failed",
    createdAt: "2026-10-26T14:55:00Z",
    message: "Image was too blurry",
  },
  {
    id: "j5",
    projectName: "Robot Toy",
    status: "succeeded",
    createdAt: "2026-10-25T10:00:00Z",
  },
];

export const projects: Project[] = SHOW_SAMPLE_DATA ? SAMPLE_PROJECTS : [];
export const jobs: GenerationJob[] = SHOW_SAMPLE_DATA ? SAMPLE_JOBS : [];

// Placeholder number for the "Generations today" card.
export const generationsToday: number = SHOW_SAMPLE_DATA ? 4 : 0;
