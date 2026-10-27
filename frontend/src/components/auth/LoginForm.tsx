"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { useLogin } from "@/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";
import Input from "../ui/input";
import GoogleSignInButton from "./GoogleSignInButton";
import GuestGuard from "./GuestGuard";

export default function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit((values) => {
    loginMutation.mutate(values, {
      onSuccess: () => router.replace("/dashboard"),
      onError: (error) => {
        // Show server-side validation messages under the matching field.
        for (const field of ["email", "password"] as const) {
          const message = error.fieldErrors[field];
          if (message) setError(field, { message });
        }
      },
    });
  });

  const apiError = loginMutation.error;
  const showBanner =
    apiError !== null && Object.keys(apiError.fieldErrors).length === 0;

  return (
    <GuestGuard>
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

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            placeholder="Enter your password"
            showPasswordToggle
            error={errors.password?.message}
            {...register("password")}
          />

          {showBanner && (
            <p
              className="rounded-xl border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {apiError.message}
            </p>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending || loginMutation.isSuccess}
            className="landing-button auth-submit cursor-pointer flex h-12 w-full items-center justify-center rounded-xl px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-65"
          >
            <span>{loginMutation.isPending ? "Signing in..." : "Sign in"}</span>
          </button>
        </form>

        <div className="my-6 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground">
            OR
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton disabled={loginMutation.isPending} />

        <p className="mt-7 text-center text-sm text-muted-foreground">
          New to MeshSnap?{" "}
          <Link
            href="/register"
            className="font-medium text-primary-text cursor-pointer transition-colors hover:text-primary"
          >
            Create an account
          </Link>
        </p>
      </div>
    </GuestGuard>
  );
}
