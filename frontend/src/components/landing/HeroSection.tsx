import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="landing-grid pointer-events-none absolute inset-x-0 top-0 h-[760px]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />

      <div className="relative mx-auto grid min-h-[680px] w-full max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <div className="landing-enter inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-primary-subtle px-4 py-2 text-sm font-medium text-primary-text">
            <span className="landing-status-dot size-2 rounded-full bg-primary" />
            AI-powered 3D creation
          </div>

          <h1 className="landing-enter landing-enter--1 mt-7 text-[clamp(2.8rem,8vw,5rem)] font-semibold leading-[1.02] tracking-[-0.06em]">
            Turn your images{" "}
            <br className="hidden sm:block" />
            into{" "}
            <span className="hero-neon-text">
              3D models.
            </span>
          </h1>

          <p className="landing-enter landing-enter--2 mt-7 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            Bring your ideas to life. Upload an image, let AI transform it into
            a 3D model, and explore your creation in an interactive workspace.
          </p>

          <div className="landing-enter landing-enter--3 mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="landing-button inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground"
            >
              <span>Start creating</span>
              <span className="landing-button-arrow" aria-hidden="true">
                →
              </span>
            </Link>

            <a
              href="#how-it-works"
              className="landing-outline-button inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 font-medium"
            >
              See how it works
            </a>
          </div>

          <div className="landing-enter landing-enter--4 mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="text-primary-text" aria-hidden="true">✓</span>
              Simple workflow
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-primary-text" aria-hidden="true">✓</span>
              Interactive preview
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-primary-text" aria-hidden="true">✓</span>
              GLB export
            </span>
          </div>
        </div>

        <div className="landing-enter landing-enter--2 relative mx-auto w-full max-w-lg">
          <div className="absolute inset-12 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative rounded-3xl border border-border/80 bg-gradient-to-br from-surface via-surface to-surface-raised/80 p-5 shadow-card backdrop-blur sm:p-7">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <p className="font-semibold">3D Studio</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Preview workspace
                </p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-xs font-medium text-primary-text">
                Preview
              </span>
            </div>

            <div className="relative flex aspect-square items-center justify-center overflow-hidden">
              <div className="absolute size-56 rounded-full border border-primary/10" />
              <div className="absolute size-44 rounded-full border border-primary/15" />
              <div className="absolute size-32 rounded-full border border-primary/20" />

              <svg
                viewBox="0 0 240 240"
                className="landing-cube relative w-full max-w-70"
                fill="none"
                aria-label="Decorative wireframe cube representing a 3D model"
                role="img"
              >
                <g
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                >
                  <path
                    d="m120 24 82 47v96l-82 47-82-47V71l82-47Z"
                    strokeOpacity=".4"
                  />
                  <path
                    d="m120 24 82 47-82 48-82-48 82-47Z"
                    fill="var(--primary-subtle)"
                  />
                  <path
                    d="M38 71v96l82 47v-95L38 71Z"
                    fill="var(--primary-subtle)"
                    fillOpacity=".35"
                  />
                  <path
                    d="M120 119v95l82-47V71l-82 48Z"
                    fill="var(--primary-subtle)"
                    fillOpacity=".6"
                  />
                  <path d="m120 24v95m82-48-82 48-82-48" strokeOpacity=".8" />
                </g>
                <g fill="var(--primary)">
                  <circle cx="120" cy="24" r="3" />
                  <circle cx="38" cy="71" r="3" />
                  <circle cx="202" cy="71" r="3" />
                  <circle cx="120" cy="119" r="4" />
                  <circle cx="38" cy="167" r="3" />
                  <circle cx="202" cy="167" r="3" />
                  <circle cx="120" cy="214" r="3" />
                </g>
              </svg>

              <div className="absolute bottom-4 left-2 rounded-xl border border-border/80 bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
                <p className="text-xs text-muted-foreground">Output format</p>
                <p className="mt-1 text-sm font-semibold">.GLB / .GLTF</p>
              </div>

              <div className="absolute right-2 top-4 rounded-xl border border-border/80 bg-surface/95 px-3 py-2 shadow-card backdrop-blur">
                <p className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full bg-primary" />
                  AI workspace
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/80 pt-4">
              <div>
                <p className="text-sm font-medium">Your next creation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  One image. A new dimension.
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-subtle text-xl text-primary-text">
                <span aria-hidden="true">✳</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
