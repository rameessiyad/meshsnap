import { Box, ImagePlus, Sparkles, type LucideIcon } from "lucide-react";

const STEPS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ImagePlus,
    title: "Upload an image",
    description: "Pick a clear photo or drawing of a single object.",
  },
  {
    icon: Sparkles,
    title: "AI builds the 3D model",
    description: "Our AI turns your image into a 3D mesh in the background.",
  },
  {
    icon: Box,
    title: "Preview and download",
    description: "Rotate the model in 3D, then download it as a GLB file.",
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title">
      <h2 id="how-it-works-title" className="mb-4 text-lg font-semibold">
        How it works
      </h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="landing-step flex gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <span className="landing-step-number flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-surface-raised text-sm font-semibold text-primary-text">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Icon
                    className="size-4 text-primary-text"
                    aria-hidden="true"
                  />
                  {step.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
