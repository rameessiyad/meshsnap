import MeshSnapLogo from "./MeshSnapLogo";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <MeshSnapLogo className="scale-[0.88] origin-left" />
        <p>Turn your ideas into another dimension.</p>
        <p>© {currentYear} MeshSnap</p>
      </div>
    </footer>
  );
}
