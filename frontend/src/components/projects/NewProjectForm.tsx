"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  useCreateProject,
  useGenerate,
  useUploadImage,
} from "@/hooks/useProjects";
import { getErrorMessage } from "@/lib/api/errors";

import ImagePicker from "./ImagePicker";

const FIELD =
  "w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function NewProjectForm() {
  const router = useRouter();
  const createProject = useCreateProject();
  const uploadImage = useUploadImage();
  const generate = useGenerate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [startNow, setStartNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give your project a name.");
      return;
    }
    if (!file) {
      setError("Choose a reference image.");
      return;
    }

    setBusy(true);
    let projectId: string | null = createdId;
    try {
      if (!projectId) {
        const project = await createProject.mutateAsync({
          name: trimmed,
          description: description.trim() || null,
        });
        projectId = project.id;
        setCreatedId(project.id);
      }
      await uploadImage.mutateAsync({ projectId, file });
      if (startNow) await generate.mutateAsync(projectId);
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(
        projectId
          ? `${message} Your project was created, so you can retry here or open it.`
          : message,
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-2" noValidate>
      <ImagePicker file={file} onChange={setFile} disabled={busy} />

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="project-name" className="text-sm font-medium">
            Project name
          </label>
          <input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            disabled={busy || createdId !== null}
            placeholder="e.g. Ceramic mug"
            className={FIELD}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="project-description" className="text-sm font-medium">
            Description <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            disabled={busy || createdId !== null}
            className={FIELD}
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={startNow}
            onChange={(e) => setStartNow(e.target.checked)}
            disabled={busy}
            className="size-4 accent-[var(--color-primary)]"
          />
          Start generating the 3D model right away
        </label>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
          >
            {error}
            {createdId && (
              <>
                {" "}
                <Link
                  href={`/dashboard/projects/${createdId}`}
                  className="font-medium underline"
                >
                  Open project
                </Link>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {busy ? "Working…" : startNow ? "Create and generate" : "Create project"}
          </button>
          <Link
            href="/dashboard/projects"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}