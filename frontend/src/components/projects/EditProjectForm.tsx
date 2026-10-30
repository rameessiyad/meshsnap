"use client";

import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useUpdateProject } from "@/hooks/useProjects";
import { getErrorMessage } from "@/lib/api/errors";
import type { Project } from "@/lib/api/types";

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export default function EditProjectForm({
  project,
  onDone,
}: {
  project: Project;
  onDone: () => void;
}) {
  const update = useUpdateProject();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setError(null);
    update.mutate(
      {
        id: project.id,
        input: { name: trimmed, description: description.trim() || null },
      },
      {
        onSuccess: onDone,
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3">
      <div className="space-y-1">
        <label htmlFor="project-name" className="text-xs text-muted-foreground">
          Name
        </label>
        <input
          id="project-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          autoFocus
          className={FIELD}
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="project-description"
          className="text-xs text-muted-foreground"
        >
          Description (optional)
        </label>
        <textarea
          id="project-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
          rows={3}
          className={FIELD}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={update.isPending}
          className="landing-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {update.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          <span>Save</span>
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={update.isPending}
          className="landing-outline-button rounded-lg border border-border px-4 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
