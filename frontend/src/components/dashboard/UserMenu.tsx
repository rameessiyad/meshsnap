"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FocusEvent } from "react";

import { useLogout, useSession } from "@/hooks/useAuth";

import { getUserInitial, getUserName } from "./utils";

export default function UserMenu() {
  const router = useRouter();
  const { data: user } = useSession();
  const logout = useLogout();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const signOutRef = useRef<HTMLButtonElement>(null);

  const name = getUserName(user) ?? "Account";
  const email = user?.email ?? "";

  useEffect(() => {
    if (!open) return;

    signOutRef.current?.focus();

    function onPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus(); // focus returns to the trigger
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Tabbing out of the menu closes it.
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false);
    }
  }

  function handleSignOut() {
    setOpen(false);
    logout.mutate(undefined, {
      onSettled: () => router.replace("/login"),
    });
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="landing-outline-button flex h-10 items-center gap-2 rounded-lg border border-border bg-surface py-1 pl-1 pr-2 sm:pr-3"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {getUserInitial(user)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
          {name}
        </span>
        <ChevronDown
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="animate-fade-in absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface-raised p-2 shadow-card"
        >
          <div className="border-b border-border px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            {email && (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            )}
          </div>
          <button
            ref={signOutRef}
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={logout.isPending}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-danger-subtle hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {logout.isPending ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
