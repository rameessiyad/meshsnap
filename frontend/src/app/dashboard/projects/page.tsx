import ProjectsOverview from "@/components/projects/ProjectsOverview";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <ProjectsOverview />;
}