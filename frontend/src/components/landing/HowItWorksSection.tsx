const steps = [
  {
    number: "01",
    title: "Upload an image",
    description: "Choose a reference image of the object you want to create.",
  },
  {
    number: "02",
    title: "Generate with AI",
    description: "Submit your image and follow the generation progress.",
  },
  {
    number: "03",
    title: "Preview and export",
    description:
      "Explore your model and download the generated asset when ready.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 overflow-hidden"
    >
      <div className="pointer-events-none absolute left-1/2 top-20 size-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-text">
            Simple by design
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps to your 3D model.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3 md:gap-6">
          {steps.map(({ number, title, description }) => (
            <article
              key={number}
              className="landing-step group rounded-2xl border border-border/80 bg-surface/70 p-6 text-center transition-colors duration-200 hover:border-primary/30 sm:p-8"
            >
              <p className="landing-step-number mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/25 bg-surface-raised font-mono text-sm font-medium text-primary-text">
                {number}
              </p>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
