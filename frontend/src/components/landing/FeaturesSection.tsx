const features = [
  {
    icon: "↗",
    title: "Image to 3D",
    description:
      "Start with a reference image and turn your idea into a three-dimensional asset using AI.",
    label: "Create",
  },
  {
    icon: "◈",
    title: "Explore in 3D",
    description:
      "Preview your generated models and inspect them from different angles in an interactive viewer.",
    label: "Inspect",
  },
  {
    icon: "↓",
    title: "Keep your assets",
    description:
      "Organize your creations and download model files for your supported 3D workflows.",
    label: "Export",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative scroll-mt-24 border-y border-border/70 bg-surface/40"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-text">
            Made for creators
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            From a simple image to a new dimension.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            A straightforward workspace for generating, previewing, and
            organizing your 3D creations.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
          {features.map(({ icon, title, description, label }) => (
            <article
              key={title}
              className="landing-feature-card rounded-2xl border border-border bg-surface p-6 sm:p-7"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl border border-primary/15 bg-primary-subtle text-xl text-primary-text">
                  {icon}
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
