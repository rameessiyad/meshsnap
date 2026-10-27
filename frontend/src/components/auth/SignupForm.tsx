"use client";

import Link from "next/link";
import Input from "../ui/input";
import GoogleSignInButton from "./GoogleSignInButton";
import useAuthSubmission from "./useAuthSubmission";

export default function SignupForm() {
  const { error, handleSubmit, isSubmitting, success } =
    useAuthSubmission("register");

  return (
    <div className="landing-enter">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-text">
          Start creating
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Turn your ideas into 3D creations with MeshSnap.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          id="display_name"
          label={
            <>
              Name <span className="text-muted-foreground">(optional)</span>
            </>
          }
          name="display_name"
          type="text"
          autoComplete="name"
          maxLength={100}
          placeholder="Your name"
        />

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

        <div>
          <Input
            id="password"
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={128}
            placeholder="At least 10 characters"
            showPasswordToggle
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Use 10–128 characters.
          </p>
        </div>

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
            Your account is ready.{" "}
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
          <span>{isSubmitting ? "Creating account..." : "Create account"}</span>
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
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary-text transition-colors hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
