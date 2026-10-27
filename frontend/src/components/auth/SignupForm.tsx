"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { useRegister } from "@/hooks/useAuth";
import {
  MIN_PASSWORD_LENGTH,
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validation/auth";
import Input from "../ui/input";
import GoogleSignInButton from "./GoogleSignInButton";
import GuestGuard from "./GuestGuard";

export default function SignupForm() {
  const router = useRouter();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { display_name: "", email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit((values) => {
    registerMutation.mutate(
      {
        email: values.email,
        password: values.password,
        display_name: values.display_name || null,
      },
      {
        onSuccess: () => router.replace("/dashboard"),
        onError: (error) => {
          // Email already registered: show it under the email field.
          if (error.status === 409) {
            setError("email", { message: error.message });
            return;
          }

          for (const field of ["display_name", "email", "password"] as const) {
            const message = error.fieldErrors[field];
            if (message) setError(field, { message });
          }
        },
      },
    );
  });

  const apiError = registerMutation.error;
  const showBanner =
    apiError !== null &&
    apiError.status !== 409 &&
    Object.keys(apiError.fieldErrors).length === 0;

  return (
    <GuestGuard>
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

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            id="display_name"
            label={
              <>
                Name <span className="text-muted-foreground">(optional)</span>
              </>
            }
            type="text"
            autoComplete="name"
            maxLength={100}
            placeholder="Your name"
            error={errors.display_name?.message}
            {...register("display_name")}
          />

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

          <div>
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              maxLength={128}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              showPasswordToggle
              error={errors.password?.message}
              {...register("password")}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Use 10–128 characters.
            </p>
          </div>

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
            disabled={registerMutation.isPending || registerMutation.isSuccess}
            className="landing-button auth-submit cursor-pointer flex h-12 w-full items-center justify-center rounded-xl px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-65"
          >
            <span>
              {registerMutation.isPending
                ? "Creating account..."
                : "Create account"}
            </span>
          </button>
        </form>

        <div className="my-6 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground">
            OR
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton disabled={registerMutation.isPending} />

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium cursor-pointer text-primary-text transition-colors hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </GuestGuard>
  );
}
