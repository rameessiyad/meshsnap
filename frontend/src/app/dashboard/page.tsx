"use client";

import { useRouter } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import { useLogout, useSession } from "@/hooks/useAuth";

function DashboardContent() {
  const router = useRouter();
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => router.replace("/login"),
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-text">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Welcome{user?.display_name ? `, ${user.display_name}` : ""}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Signed in as {user?.email}. Projects and 3D generation come next.
        </p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        className="landing-button auth-submit flex h-12 w-fit items-center justify-center rounded-xl px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-65"
      >
        {logoutMutation.isPending ? "Signing out..." : "Sign out"}
      </button>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
