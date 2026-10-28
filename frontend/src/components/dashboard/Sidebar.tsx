"use client";

import { Box, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";

import { NAV_ITEMS, isActivePath } from "./nav-items";

type SidebarProps = {
  onNavigate?: () => void;
  onClose?: () => void; // only passed for the mobile drawer
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
};

export default function Sidebar({
  onNavigate,
  onClose,
  closeButtonRef,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Box className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">MeshSnap</span>
        </Link>

        {onClose && (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="landing-outline-button flex size-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const baseClasses =
              "dashboard-nav-link flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium";

            if (item.disabled) {
              return (
                <li key={item.label}>
                  <span
                    aria-disabled="true"
                    className={`${baseClasses} cursor-not-allowed text-muted-foreground opacity-60`}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Soon
                    </span>
                  </span>
                </li>
              );
            }

            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`${baseClasses} ${
                    active
                      ? "bg-primary-subtle text-primary-text"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-border p-4">
        <div className="flex items-center gap-2.5 rounded-lg bg-surface-raised px-3 py-2.5 text-xs text-muted-foreground">
          <span
            className="landing-status-dot size-2 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
          Private MVP · free use
        </div>
      </div>
    </div>
  );
}
