"use client";

import { ArrowLeft, Download, Loader2, Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import JobStatusBadge from "@/components/dashboard/JobStatusBadge";
import RelativeTime from "@/components/dashboard/RelativeTime";
import {
  useCancelJob,
  useDeleteProject,
  useDeleteVersion,
  useGenerate,
  useProject,
  useQuota,
  useUploadImage,
  useUploadThumbnail,
  useVersions,
} from "@/hooks/useProjects";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { downloadAsset } from "@/lib/api/generation";
import { isActiveStatus, type ModelFormat } from "@/lib/api/types";

import ConfirmDialog from "./ConfirmDialog";
import EditProjectForm from "./EditProjectForm";
import ImagePicker from "./ImagePicker";
import ProjectImage from "./ProjectImage";
import VersionPicker from "./VersionPicker";

// Three.js only runs in the browser, so it is never rendered on the server.
const ModelViewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-raised" />
  ),
});

const BUTTON =
  "landing-outline-button inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60";

const FORMATS: ModelFormat[] = ["glb", "obj", "stl"];

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
  const latestId = project?.model_asset_id ?? null;
  const versionsQuery = useVersions(id, latestId);
  const quota = useQuota();
  const uploadImage = useUploadImage();
  const uploadThumbnail = useUploadThumbnail();
  const generate = useGenerate();
  const cancel = useCancelJob();
  const remove = useDeleteProject();
  const removeVersion = useDeleteVersion();

  const [actionError, setActionError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState<ModelFormat | null>(null);
  const [confirm, setConfirm] = useState<"project" | "version" | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // A new model arrived (or one was deleted): go back to showing the latest.
  const [trackedLatest, setTrackedLatest] = useState<string | null>(latestId);
  if (trackedLatest !== latestId) {
    setTrackedLatest(latestId);
    setSelectedAssetId(null);
  }

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

  const versions = versionsQuery.data ?? [];
  const viewAssetId =
    selectedAssetId && versions.some((v) => v.asset_id === selectedAssetId)
      ? selectedAssetId
      : modelAssetId;
  const viewVersion = versions.find((v) => v.asset_id === viewAssetId);
  const viewingLatest = viewAssetId === modelAssetId;

  const limitReached = !!quota.data && quota.data.used >= quota.data.limit;

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

  function onConfirmDelete() {
    setActionError(null);
    if (confirm === "project") {
      remove.mutate(id, {
        onSuccess: () => router.push("/dashboard/projects"),
        onError: (err) => {
          setConfirm(null);
          setActionError(getErrorMessage(err));
        },
      });
    } else if (confirm === "version" && viewAssetId) {
      removeVersion.mutate(viewAssetId, {
        onSuccess: () => {
          setSelectedAssetId(null);
          setConfirm(null);
        },
        onError: (err) => {
          setConfirm(null);
          setActionError(getErrorMessage(err));
        },
      });
    }
  }

  async function onDownload(format: ModelFormat) {
    if (!viewAssetId) return;
    setActionError(null);
    setDownloading(format);
    try {
      const suffix = viewVersion ? `-v${viewVersion.version}` : "";
      await downloadAsset(
        viewAssetId,
        `${fileSlug(project!.name)}${suffix}.${format}`,
        format,
      );
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDownloading(null);
    }
  }

  function onThumbnail(blob: Blob, auto: boolean) {
    uploadThumbnail.mutate(
      { projectId: id, blob },
      {
        onError: (err) => {
          // An automatic snapshot failing is not worth interrupting the user.
          if (!auto) setActionError(getErrorMessage(err));
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === "version"
            ? "Delete this version?"
            : "Delete this project?"
        }
        description={
          confirm === "version"
            ? "This model version and its file will be removed. This cannot be undone."
            : "The project, its reference image and all generated models will be removed. This cannot be undone."
        }
        confirmLabel={
          confirm === "version" ? "Delete version" : "Delete project"
        }
        busy={remove.isPending || removeVersion.isPending}
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirm(null)}
      />

      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Projects
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          {editing ? (
            <EditProjectForm
              project={project}
              onDone={() => setEditing(false)}
            />
          ) : (
            <>
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={`${BUTTON} text-muted-foreground`}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm("project")}
                  disabled={active || remove.isPending}
                  className={`${BUTTON} text-muted-foreground hover:text-danger`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </>
          )}
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
                  className={`${BUTTON} landing-button border-transparent disabled:opacity-60`}
                >
                  {uploadImage.isPending && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  <span>Upload image</span>
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

          {viewAssetId && (
            <ModelViewer
              assetId={viewAssetId}
              name={fileSlug(project.name)}
              onThumbnail={viewingLatest ? onThumbnail : undefined}
              thumbnailSaving={uploadThumbnail.isPending}
              autoThumbnail={!project.thumbnail_asset_id && viewingLatest}
            />
          )}

          <VersionPicker
            versions={versions}
            selectedId={viewAssetId}
            onSelect={setSelectedAssetId}
          />

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
                {job.error_message ?? "Generation failed. Please try again."}{" "}
                Failed attempts do not count toward your daily limit.
              </p>
            )}

            {job?.status === "cancelled" && (
              <p className="text-sm text-muted-foreground">
                The last generation was cancelled.
              </p>
            )}

            {viewAssetId && !active && (
              <div className="space-y-3 rounded-lg bg-primary-subtle px-3 py-3">
                <p className="text-sm font-medium text-primary-text">
                  {viewVersion
                    ? `Version ${viewVersion.version} is ready.`
                    : "Your 3D model is ready."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => onDownload(format)}
                      disabled={downloading !== null}
                      className={`${BUTTON} border border-border bg-surface text-foreground`}
                    >
                      {downloading === format ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Download className="size-4" aria-hidden="true" />
                      )}
                      <span>{format.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  GLB for web and viewers. OBJ and STL for 3D printing and other
                  3D tools.
                </p>
                {versions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setConfirm("version")}
                    disabled={removeVersion.isPending}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Delete this version
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGenerate}
                disabled={
                  !project.has_source_image ||
                  active ||
                  generate.isPending ||
                  limitReached
                }
                className={`${BUTTON} landing-button border-transparent disabled:opacity-60`}
              >
                {generate.isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                <span>
                  {job?.status === "failed"
                    ? "Retry generation"
                    : modelAssetId
                      ? "Regenerate"
                      : "Generate 3D model"}
                </span>
              </button>
              {active && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={cancel.isPending}
                  className={`${BUTTON} border border-border`}
                >
                  {cancel.isPending ? "Cancelling…" : "Cancel"}
                </button>
              )}
            </div>

            {!project.has_source_image && (
              <p className="text-xs text-muted-foreground">
                Upload a reference image first.
              </p>
            )}

            {limitReached && (
              <p className="text-xs text-warning">
                You have used all {quota.data?.limit} generations for today. The
                limit resets at midnight UTC.
              </p>
            )}

            {modelAssetId && (
              <p className="text-xs text-muted-foreground">
                Regenerating keeps your earlier versions, so you can compare
                them.
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
