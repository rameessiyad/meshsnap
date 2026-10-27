import Link from "next/link";

export default function CTASection() {
  return (
    <section className="relative z-10 px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
      <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-subtle via-surface to-surface-raised p-7 shadow-card sm:p-10 md:flex-row md:items-center md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-text">
            Your next idea starts here
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to bring your ideas to life?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Start building your personal library of 3D creations with MeshSnap.
          </p>
        </div>
        <Link
          href="/register"
          className="landing-button relative z-10 inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground sm:w-auto"
        >
          <span>Get started</span>
          <span className="landing-button-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
