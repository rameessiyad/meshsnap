"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // We remember the page where the drawer was opened. If the page changes,
  // the drawer is automatically "closed" (no extra effect needed).
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const open = drawerPath === pathname;

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openDrawer = useCallback(() => setDrawerPath(pathname), [pathname]);
  const closeDrawer = useCallback(() => {
    setDrawerPath(null);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeDrawer]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        aria-label="Sidebar"
        className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-surface lg:block"
      >
        <Sidebar />
      </aside>

      {/* Mobile drawer: backdrop + panel */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        id="mobile-drawer"
        aria-label="Navigation drawer"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-surface shadow-card transition-transform duration-200 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          onNavigate={closeDrawer}
          onClose={closeDrawer}
          closeButtonRef={closeButtonRef}
        />
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar
          menuOpen={open}
          onMenuClick={openDrawer}
          menuButtonRef={menuButtonRef}
        />

        <main
          id="main-content"
          className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <div
            aria-hidden="true"
            className="landing-grid pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60"
          />
          <div className="relative mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
