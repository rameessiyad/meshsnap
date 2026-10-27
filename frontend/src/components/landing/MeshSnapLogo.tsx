import Link from "next/link";

type MeshSnapLogoProps = {
  className?: string;
};

export default function MeshSnapLogo({ className = "" }: MeshSnapLogoProps) {
  return (
    <Link
      href="/"
      aria-label="MeshSnap home"
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <span className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle shadow-glow transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-6 text-primary-text"
          aria-hidden="true"
        >
          <path
            d="m12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4l8-4.6Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="m4 7.4 8 4.7 8-4.7M12 12.1v9.1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">
        Mesh<span className="text-primary-text">Snap</span>
      </span>
    </Link>
  );
}
