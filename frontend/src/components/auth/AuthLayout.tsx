import type { ReactNode } from "react";
import MeshSnapLogo from "@/components/landing/MeshSnapLogo";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="auth-split min-h-screen bg-background text-foreground">
      <aside className="auth-brand-panel relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-border/70 px-10 py-10 lg:flex xl:px-16 xl:py-12">
        <div className="landing-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="auth-panel-glow pointer-events-none absolute -left-36 top-[22%] size-[520px] rounded-full bg-primary/10 blur-[130px]" />

        <div className="relative z-10">
          <MeshSnapLogo />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-2xl">
          <div className="relative flex min-h-[410px] items-center justify-center">
            <div className="auth-orbit absolute size-[340px] rounded-full border border-primary/10" />
            <div className="auth-orbit auth-orbit--reverse absolute size-[270px] rounded-full border border-primary/15 border-dashed" />
            <div className="absolute size-[190px] rounded-full bg-primary/10 blur-[70px]" />

            <svg
              viewBox="0 0 360 360"
              fill="none"
              className="auth-wireframe relative z-10 w-full max-w-[330px]"
              role="img"
              aria-label="Glowing wireframe mesh representing an AI-generated 3D model"
            >
              <defs>
                <linearGradient id="mesh-face" x1="72" y1="70" x2="286" y2="296">
                  <stop stopColor="var(--accent-emerald)" stopOpacity=".16" />
                  <stop offset=".52" stopColor="var(--accent-electric)" stopOpacity=".08" />
                  <stop offset="1" stopColor="var(--accent-lime)" stopOpacity=".2" />
                </linearGradient>
                <linearGradient id="mesh-line" x1="74" y1="78" x2="286" y2="292">
                  <stop stopColor="var(--accent-emerald)" />
                  <stop offset=".52" stopColor="var(--accent-electric)" />
                  <stop offset="1" stopColor="var(--accent-lime)" />
                </linearGradient>
              </defs>
              <g className="auth-orbit" opacity=".42">
                <ellipse
                  cx="180"
                  cy="180"
                  rx="135"
                  ry="47"
                  stroke="var(--primary)"
                  strokeOpacity=".5"
                  transform="rotate(-32 180 180)"
                />
              </g>
              <g
                stroke="url(#mesh-line)"
                strokeLinejoin="round"
                strokeWidth="1.5"
              >
                <path
                  d="m180 38 116 67v134l-116 67-116-67V105l116-67Z"
                  fill="url(#mesh-face)"
                  strokeOpacity=".8"
                />
                <path d="m64 105 116 68 116-68M180 173v133" strokeOpacity=".75" />
                <path d="m64 172 116-67 116 67M64 239l116-66 116 66" strokeOpacity=".5" />
                <path d="m122 72 116 67v134M238 72l-116 67v134" strokeOpacity=".38" />
                <path d="m180 38-58 101m58-101 58 101M64 105l58 34m174-34-58 34" strokeOpacity=".65" />
                <path d="m64 172 58 34m174-34-58 34M64 239l58-33m174 33-58-33" strokeOpacity=".45" />
              </g>
              <g fill="var(--accent-lime)">
                <circle cx="180" cy="38" r="4" />
                <circle cx="64" cy="105" r="3" />
                <circle cx="296" cy="105" r="3" />
                <circle cx="180" cy="173" r="4" />
                <circle cx="64" cy="239" r="3" />
                <circle cx="296" cy="239" r="3" />
                <circle cx="180" cy="306" r="4" />
              </g>
            </svg>

            <div className="auth-particle absolute left-[15%] top-[25%] size-2 rounded-full bg-accent-lime" />
            <div className="auth-particle auth-particle--delayed absolute bottom-[20%] right-[16%] size-2 rounded-full bg-accent-emerald" />

            <div className="absolute left-0 top-[22%] rounded-xl border border-border/80 bg-surface/90 px-4 py-3 shadow-card backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Source
              </p>
              <p className="mt-1 text-sm font-medium">Your image</p>
            </div>
            <div className="absolute bottom-[18%] right-0 rounded-xl border border-primary/25 bg-surface/90 px-4 py-3 shadow-card backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Ready to export
              </p>
              <p className="mt-1 text-sm font-semibold text-primary-text">
                3D mesh · GLB
              </p>
            </div>
          </div>

          <div className="mx-auto mt-5 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-text">
              From pixels to polygons
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.12] tracking-[-0.045em] xl:text-5xl">
              Turn your images into stunning 3D models with AI.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Bring a single image into a whole new dimension. Create, explore,
              and keep your ideas in one intuitive workspace.
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground">
          A new dimension for your ideas.
        </p>
      </aside>

      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-5 py-10 sm:px-10 lg:px-12 xl:px-20">
        <div className="landing-grid pointer-events-none absolute inset-x-0 top-0 h-96 opacity-30 lg:hidden" />
        <div className="pointer-events-none absolute -right-36 top-0 size-96 rounded-full bg-primary/10 blur-[120px] lg:hidden" />
        <div className="relative z-10 mx-auto w-full max-w-[460px]">
          <div className="mb-9 lg:hidden">
            <MeshSnapLogo />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
