import { Plus } from "lucide-react";
import Link from "next/link";

export default function NewProjectCard() {
  return (
    <section
      aria-labelledby="new-project-title"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <div>
        <h2 id="new-project-title" className="text-lg font-semibold">
          Turn a photo into a 3D model
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload one clear image and MeshSnap generates a downloadable GLB.
        </p>
      </div>
      <Link
        href="/dashboard/projects/new"
        className="landing-button inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
      >
        <Plus className="size-4" aria-hidden="true" />
        <span>New project</span>
      </Link>
    </section>
  );
}