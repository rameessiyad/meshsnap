"use client";

export default function ProjectsError({ reset }: { reset: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-border bg-surface p-8 text-center"
    >
      <p className="font-medium">Something went wrong</p>
      <p className="mt-1 text-sm text-muted-foreground">
        This page could not be displayed. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="landing-outline-button mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
