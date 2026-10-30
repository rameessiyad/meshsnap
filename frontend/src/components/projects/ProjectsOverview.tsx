"use client";

import { Box, Plus, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import EmptyState from "@/components/dashboard/EmptyState";
import { useProjects } from "@/hooks/useProjects";
import { getErrorMessage } from "@/lib/api/errors";

import ProjectCard from "./ProjectCard";

export default function ProjectsOverview() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // Wait a moment after typing stops before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: projects, isPending, error } = useProjects(debounced);
  const searching = debounced.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="landing-button inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>New project</span>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search projects"
          aria-label="Search projects"
          maxLength={100}
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-60 animate-pulse rounded-2xl bg-surface-raised"
            />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-400">
          {getErrorMessage(error)}
        </p>
      ) : projects.length === 0 ? (
        searching ? (
          <EmptyState
            icon={SearchX}
            title="No matching projects"
            description="Try a different name, or clear the search."
          />
        ) : (
          <EmptyState
            icon={Box}
            title="No projects yet"
            description="Create a project from a photo to generate your first 3D model."
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
