"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useSession } from "@/hooks/useAuth";

export default function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user } = useSession();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return <>{children}</>;
}