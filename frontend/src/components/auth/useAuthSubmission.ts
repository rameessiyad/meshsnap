"use client";

import { useState, type FormEvent } from "react";

type AuthMode = "login" | "register";
type ApiValidationError = {
  msg?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getApiError(payload: unknown, status: number): string {
  if (isRecord(payload) && typeof payload.detail === "string") {
    return payload.detail;
  }

  if (isRecord(payload) && Array.isArray(payload.detail)) {
    const messages = payload.detail
      .filter(
        (item): item is ApiValidationError =>
          isRecord(item) && typeof item.msg === "string",
      )
      .map((item) => item.msg)
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (status === 401) {
    return "Invalid email or password.";
  }

  return "We couldn’t complete your request. Please check your details and try again.";
}

export default function useAuthSubmission(mode: AuthMode) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const body =
      mode === "register"
        ? {
            email,
            password,
            display_name: String(formData.get("display_name") ?? "").trim() || null,
          }
        : { email, password };

    const apiBaseUrl = (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
    ).replace(/\/+$/, "");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/auth/${mode === "register" ? "register" : "login"}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (parseError) {
        if (!(parseError instanceof SyntaxError)) {
          throw parseError;
        }
        payload = null;
      }

      if (!response.ok) {
        throw new Error(getApiError(payload, response.status));
      }

      if (
        !isRecord(payload) ||
        typeof payload.csrf_token !== "string" ||
        payload.csrf_token.length === 0
      ) {
        throw new Error("The server returned an invalid authentication response.");
      }

      window.sessionStorage.setItem("meshsnap_csrf_token", payload.csrf_token);
      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof TypeError
          ? "Unable to reach MeshSnap. Check your connection and try again."
          : submitError instanceof Error
            ? submitError.message
            : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return { error, handleSubmit, isSubmitting, success };
}
