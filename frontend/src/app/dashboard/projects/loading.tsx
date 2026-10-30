export default function ProjectsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-raised" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-60 animate-pulse rounded-2xl bg-surface-raised"
          />
        ))}
      </div>
    </div>
  );
}
