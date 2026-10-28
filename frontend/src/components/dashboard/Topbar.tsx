"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";

import { NAV_ITEMS, isActivePath } from "./nav-items";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

type TopbarProps = {
  menuOpen: boolean;
  onMenuClick: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
};

export default function Topbar({
  menuOpen,
  onMenuClick,
  menuButtonRef,
}: TopbarProps) {
  const pathname = usePathname();
  const title =
    NAV_ITEMS.find(
      (item) => !item.disabled && isActivePath(pathname, item.href),
    )?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        aria-expanded={menuOpen}
        aria-controls="mobile-drawer"
        className="landing-outline-button flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <p className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
        <span className="text-foreground">{title}</span>
      </p>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
