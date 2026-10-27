import Link from "next/link";
import MeshSnapLogo from "./MeshSnapLogo";

const navigationLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
];

export default function Navbar() {
  return (
    <header className="relative z-20 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 sm:h-20 sm:flex-nowrap sm:px-8 sm:py-0 lg:px-10"
      >
        <MeshSnapLogo />

        <div className="order-3 flex w-full items-center justify-center gap-7 text-sm text-muted-foreground sm:order-none sm:w-auto sm:gap-8">
          {navigationLinks.map(({ href, label }) => (
            <a key={href} href={href} className="landing-nav-link py-1">
              {label}
            </a>
          ))}
        </div>

        <Link
          href="/login"
          className="landing-outline-button rounded-lg border border-border px-4 py-2 text-sm font-medium sm:px-5 sm:py-2.5"
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
}
