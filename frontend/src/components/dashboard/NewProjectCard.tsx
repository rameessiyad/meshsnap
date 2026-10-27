import { ImagePlus, Sparkles } from "lucide-react";

export default function NewProjectCard() {
  return (
    <section
      aria-labelledby="new-model-title"
      className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <h2 id="new-model-title" className="text-lg font-semibold">
        Create a new 3D model
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload one clear image and let AI build the 3D model for you.
      </p>

      {/* UI only: no upload logic yet */}
      <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-strong bg-background px-4 py-10 text-center">
        <span className="glow-primary flex size-14 items-center justify-center rounded-xl bg-primary-subtle text-primary-text">
          <ImagePlus className="size-7" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium">
          Drop an image here or{" "}
          <span className="text-primary-text underline underline-offset-4">
            browse
          </span>
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPG or WebP</p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled
          className="landing-button flex h-12 items-center justify-center rounded-xl px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-5" aria-hidden="true" />
            Start generating
          </span>
        </button>
        <p className="text-sm text-muted-foreground">
          Coming soon: generation is not connected yet.
        </p>
      </div>
    </section>
  );
}
