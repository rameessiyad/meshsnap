"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useSession } from "@/hooks/useAuth";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isPending, isError, error, refetch } = useSession();

  useEffect(() => {
    if (!isPending && !isError && !user) {
      router.replace("/login");
    }
  }, [isPending, isError, user, router]);

  if (isPending) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"
        role="status"
      >
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-danger" role="alert">
          {error.message}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="landing-button auth-submit h-11 rounded-xl px-5 font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}