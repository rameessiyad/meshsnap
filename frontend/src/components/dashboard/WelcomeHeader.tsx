"use client";

import { useSession } from "@/hooks/useAuth";

import { getUserName } from "./utils";

export default function WelcomeHeader() {
  const { data: user } = useSession();
  const name = getUserName(user);

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Welcome back
        {name && (
          <>
            , <span className="hero-neon-text dashboard-welcome-name break-words">{name}</span>
          </>
        )}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Turn images into 3D models. Start a new generation or pick up where you left off.
      </p>
    </div>
  );
}