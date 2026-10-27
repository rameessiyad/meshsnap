"use client";

import Link from "next/link";
import Input from "../ui/input";
import GoogleSignInButton from "./GoogleSignInButton";
import useAuthSubmission from "./useAuthSubmission";

export default function LoginForm() {
  const { error, handleSubmit, isSubmitting, success } =
    useAuthSubmission("login");

  return (
    <div className="landing-enter">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-text">
          Welcome back
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Sign in to MeshSnap
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Pick up where your next 3D creation begins.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          placeholder="you@example.com"
        />

        <Input
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={1}
          maxLength={128}
          placeholder="Enter your password"
          showPasswordToggle
        />

        {error && (
          <p
            className="rounded-xl border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="rounded-xl border border-primary/30 bg-primary-subtle px-4 py-3 text-sm text-primary-text"
            role="status"
          >
            You’re signed in. Your session is ready.{" "}
            <Link href="/" className="font-semibold underline underline-offset-4">
              Continue to MeshSnap
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || success}
          className="landing-button auth-submit flex h-12 w-full items-center justify-center rounded-xl px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-65"
        >
          <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>
        </button>
      </form>

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground">
          OR
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignInButton />

      <p className="mt-7 text-center text-sm text-muted-foreground">
        New to MeshSnap?{" "}
        <Link
          href="/register"
          className="font-medium text-primary-text transition-colors hover:text-primary"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
