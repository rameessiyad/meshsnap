import type { Metadata } from "next";

import NewProjectForm from "@/components/projects/NewProjectForm";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
      <NewProjectForm />
    </div>
  );
}