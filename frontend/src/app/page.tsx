import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />

      {/* Navbar */}
      <header className="relative z-10 border-b border-border">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
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
            </div>

            <span className="text-xl font-bold tracking-tight">
              Mesh<span className="text-primary-text">Snap</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </a>
          </div>

          <Link
            href="/login"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary-subtle"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-subtle px-4 py-2 text-sm text-primary-text">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            AI-powered 3D creation
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Turn your images
            <br />
            into <span className="text-primary-text">3D models.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            Bring your ideas to life. Upload an image, let AI transform it into
            a 3D model, and explore your creation in an interactive workspace.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover"
            >
              Start creating
              <span aria-hidden="true">→</span>
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 font-medium transition-colors hover:bg-surface-raised"
            >
              See how it works
            </a>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span>✓ Simple workflow</span>
            <span>✓ Interactive preview</span>
            <span>✓ GLB export</span>
          </div>
        </div>

        {/* Decorative 3D-inspired preview — no extra component or image required */}
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-10 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative rounded-3xl border border-border bg-surface/90 p-5 shadow-card backdrop-blur sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="font-semibold">3D Studio</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Preview workspace
                </p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-xs text-primary-text">
                Preview
              </span>
            </div>

            <div className="relative flex aspect-square items-center justify-center overflow-hidden">
              <div className="absolute size-56 rounded-full border border-primary/10" />
              <div className="absolute size-44 rounded-full border border-primary/15" />
              <div className="absolute size-32 rounded-full border border-primary/20" />

              <svg
                viewBox="0 0 240 240"
                className="relative w-full max-w-[280px] drop-shadow-[0_0_25px_rgba(57,255,136,0.18)]"
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

              <div className="absolute bottom-4 left-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-card">
                <p className="text-xs text-muted-foreground">Output format</p>
                <p className="mt-1 text-sm font-semibold">.GLB / .GLTF</p>
              </div>

              <div className="absolute right-2 top-4 rounded-xl border border-border bg-surface px-3 py-2 shadow-card">
                <p className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-full bg-primary" />
                  AI workspace
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium">Your next creation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  One image. A new dimension.
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-subtle text-primary-text">
                <span className="text-xl" aria-hidden="true">
                  ✳
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 border-t border-border bg-surface/40"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-text">
              Made for creators
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              From a simple image to a new dimension.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              A straightforward workspace for generating, previewing, and
              organizing your 3D creations.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/30">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary-subtle text-lg text-primary-text">
                ↗
              </div>
              <h3 className="mt-5 text-lg font-semibold">Image to 3D</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Start with a reference image and turn your idea into a
                three-dimensional asset using AI.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/30">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary-subtle text-lg text-primary-text">
                ◈
              </div>
              <h3 className="mt-5 text-lg font-semibold">Explore in 3D</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Preview your generated models and inspect them from different
                angles in an interactive viewer.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/30">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary-subtle text-lg text-primary-text">
                ↓
              </div>
              <h3 className="mt-5 text-lg font-semibold">Keep your assets</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Organize your creations and download model files for your
                supported 3D workflows.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-text">
              Simple by design
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to your 3D model.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <p className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary-subtle font-mono text-primary-text">
                01
              </p>
              <h3 className="mt-5 font-semibold">Upload an image</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                Choose a reference image of the object you want to create.
              </p>
            </div>

            <div className="text-center">
              <p className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary-subtle font-mono text-primary-text">
                02
              </p>
              <h3 className="mt-5 font-semibold">Generate with AI</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                Submit your image and follow the generation progress.
              </p>
            </div>

            <div className="text-center">
              <p className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary-subtle font-mono text-primary-text">
                03
              </p>
              <h3 className="mt-5 font-semibold">Preview and export</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                Explore your model and download the generated asset when ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-20 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 rounded-3xl border border-primary/20 bg-primary-subtle p-8 sm:p-12 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to bring your ideas to life?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Start building your personal library of 3D creations with
              MeshSnap.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Get started <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <Link href="/" className="font-semibold text-foreground">
            Mesh<span className="text-primary-text">Snap</span>
          </Link>
          <p>Turn your ideas into another dimension.</p>
          <p>© {new Date().getFullYear()} MeshSnap</p>
        </div>
      </footer>
    </main>
  );
}
