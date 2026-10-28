"use client";

import { ArrowLeft, Download, Loader2, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import JobStatusBadge from "@/components/dashboard/JobStatusBadge";
import RelativeTime from "@/components/dashboard/RelativeTime";
import {
  useCancelJob,
  useDeleteProject,
  useGenerate,
  useProject,
  useQuota,
  useUploadImage,
} from "@/hooks/useProjects";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { downloadAsset } from "@/lib/api/generation";
import { isActiveStatus } from "@/lib/api/types";

import ImagePicker from "./ImagePicker";
import ProjectImage from "./ProjectImage";

// Three.js only runs in the browser, so it is never rendered on the server.
const ModelViewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-raised" />
  ),
});

const BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-60";

function fileSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "model"
  );
}

export default function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: project, isPending, error } = useProject(id);
  const quota = useQuota();
  const uploadImage = useUploadImage();
  const generate = useGenerate();
  const cancel = useCancelJob();
  const remove = useDeleteProject();

  const [actionError, setActionError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (isPending) {
    return <div className="h-96 animate-pulse rounded-2xl bg-surface-raised" />;
  }

  if (error || !project) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="font-medium">
          {notFound ? "Project not found" : "Could not load this project"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {notFound ? "It may have been deleted." : getErrorMessage(error)}
        </p>
        <Link
          href="/dashboard/projects"
          className="mt-4 inline-block text-sm font-medium text-primary-text underline"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  const job = project.latest_job;
  const active = !!job && isActiveStatus(job.status);
  const showPicker = !project.has_source_image || replacing;
  const modelAssetId = project.model_asset_id;

  function onUpload() {
    if (!file) return;
    setActionError(null);
    uploadImage.mutate(
      { projectId: id, file },
      {
        onSuccess: () => {
          setFile(null);
          setReplacing(false);
        },
        onError: (err) => setActionError(getErrorMessage(err)),
      },
    );
  }

  function onGenerate() {
    setActionError(null);
    generate.mutate(id, {
      onError: (err) => setActionError(getErrorMessage(err)),
    });
  }

  function onCancel() {
    if (!job) return;
    setActionError(null);
    cancel.mutate(job.id, {
      onError: (err) => setActionError(getErrorMessage(err)),
    });
  }

  function onDelete() {
    if (
      !window.confirm(
        "Delete this project and its files? This cannot be undone.",
      )
    ) {
      return;
    }
    setActionError(null);
    remove.mutate(id, {
      onSuccess: () => router.push("/dashboard/projects"),
      onError: (err) => setActionError(getErrorMessage(err)),
    });
  }

  async function onDownload() {
    if (!modelAssetId) return;
    setActionError(null);
    setDownloading(true);
    try {
      await downloadAsset(modelAssetId, `${fileSlug(project!.name)}.glb`);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Projects
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
            <p className="mt-1 min-h-4 text-xs text-muted-foreground">
              Created <RelativeTime iso={project.created_at} />
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={active || remove.isPending}
            className={`${BUTTON} border border-border text-muted-foreground hover:text-danger`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-subtle px-3 py-2.5 text-sm text-danger"
        >
          {actionError}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Reference image */}
        <section aria-labelledby="image-title" className="space-y-3">
          <h2 id="image-title" className="text-lg font-semibold">
            Reference image
          </h2>
          {showPicker ? (
            <>
              <ImagePicker
                file={file}
                onChange={setFile}
                disabled={uploadImage.isPending}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onUpload}
                  disabled={!file || uploadImage.isPending}
                  className={`${BUTTON} bg-primary text-primary-foreground hover:opacity-90`}
                >
                  {uploadImage.isPending && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  Upload image
                </button>
                {replacing && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplacing(false);
                      setFile(null);
                    }}
                    className={`${BUTTON} border border-border`}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-raised">
                <ProjectImage projectId={id} alt={project.name} fit="contain" />
              </div>
              <button
                type="button"
                onClick={() => setReplacing(true)}
                disabled={active}
                className={`${BUTTON} border border-border`}
              >
                Replace image
              </button>
            </>
          )}
        </section>

        {/* Generation */}
        <section aria-labelledby="generation-title" className="space-y-4">
          <h2 id="generation-title" className="text-lg font-semibold">
            3D model
          </h2>

          {modelAssetId && <ModelViewer assetId={modelAssetId} />}

          <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Status</span>
              {job ? (
                <JobStatusBadge status={job.status} />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Not generated yet
                </span>
              )}
            </div>

            {active && (
              <p className="text-sm text-muted-foreground">
                Generating your model. This can take a minute or more, and you
                can leave this page. It updates automatically.
              </p>
            )}

            {job?.status === "failed" && (
              <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
                {job.error_message ?? "Generation failed. Please try again."}
              </p>
            )}

            {job?.status === "cancelled" && (
              <p className="text-sm text-muted-foreground">
                The last generation was cancelled.
              </p>
            )}

            {modelAssetId && !active && (
              <div className="space-y-2 rounded-lg bg-primary-subtle px-3 py-3">
                <p className="text-sm font-medium text-primary-text">
                  Your 3D model is ready.
                </p>
                <button
                  type="button"
                  onClick={onDownload}
                  disabled={downloading}
                  className={`${BUTTON} border border-border bg-surface text-foreground`}
                >
                  {downloading ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Download className="size-4" aria-hidden="true" />
                  )}
                  Download .glb
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGenerate}
                disabled={
                  !project.has_source_image || active || generate.isPending
                }
                className={`${BUTTON} bg-primary text-primary-foreground hover:opacity-90`}
              >
                {generate.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {modelAssetId || job?.status === "failed"
                  ? "Generate again"
                  : "Generate 3D model"}
              </button>
              {active && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={cancel.isPending || !!job?.cancel_requested_at}
                  className={`${BUTTON} border border-border`}
                >
                  {job?.cancel_requested_at ? "Cancelling…" : "Cancel"}
                </button>
              )}
            </div>

            {!project.has_source_image && (
              <p className="text-xs text-muted-foreground">
                Upload a reference image first.
              </p>
            )}

            {quota.data && (
              <p className="text-xs text-muted-foreground">
                {quota.data.used} of {quota.data.limit} generations used today.
                {quota.data.provider === "mock" &&
                  " Development mode: this makes a placeholder cube."}
                {quota.data.provider === "hf" &&
                  " Free shared GPU: it can be slow or busy at times."}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
