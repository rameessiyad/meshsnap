import { FolderOpen } from "lucide-react";

import EmptyState from "./EmptyState";
import { projects } from "./mock-data";
import ProjectCard from "./ProjectCard";

export default function RecentProjects() {
  const recent = projects.slice(0, 6);

  return (
    <section aria-labelledby="recent-projects-title">
      <h2 id="recent-projects-title" className="mb-4 text-lg font-semibold">
        Recent projects
      </h2>

      {recent.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Your 3D models will show up here after you generate your first one."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recent.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}
