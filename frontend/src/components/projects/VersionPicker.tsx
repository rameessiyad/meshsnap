import type { ModelVersion } from "@/lib/api/types";

export default function VersionPicker({
  versions,
  selectedId,
  onSelect,
}: {
  versions: ModelVersion[];
  selectedId: string | null;
  onSelect: (assetId: string) => void;
}) {
  if (versions.length < 2) return null;

  return (
    <div
      role="group"
      aria-label="Model versions"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-xs text-muted-foreground">Versions</span>
      {versions.map((version) => (
        <button
          key={version.asset_id}
          type="button"
          aria-pressed={version.asset_id === selectedId}
          onClick={() => onSelect(version.asset_id)}
          className="landing-outline-button rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground aria-pressed:border-primary aria-pressed:text-primary-text"
        >
          v{version.version}
          {version.is_latest ? " · latest" : ""}
        </button>
      ))}
    </div>
  );
}
