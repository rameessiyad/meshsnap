"use client";

import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const BUTTON_CLASS =
  "auth-google-button flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border-strong bg-surface-raised px-5 text-sm font-medium text-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-65";

type GoogleSignInButtonProps = {
  disabled?: boolean;
};

function GoogleButton({ disabled = false }: GoogleSignInButtonProps) {
  const router = useRouter();
  const googleMutation = useGoogleSignIn();
  const [clientError, setClientError] = useState<string | null>(null);

  const startGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: ({ code }) => {
      setClientError(null);
      googleMutation.mutate(
        { code },
        { onSuccess: () => router.replace("/dashboard") },
      );
    },
    onError: () => setClientError("Google sign-in failed. Please try again."),
    onNonOAuthError: (error) => {
      if (error.type === "popup_failed_to_open") {
        setClientError(
          "Your browser blocked the Google popup. Allow popups and try again.",
        );
      } else {
        // The user closed the popup: nothing to report.
        setClientError(null);
      }
    },
  });

  const busy = googleMutation.isPending || googleMutation.isSuccess;
  const message = clientError ?? googleMutation.error?.message ?? null;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setClientError(null);
          googleMutation.reset();
          startGoogleLogin();
        }}
        disabled={disabled || busy}
        className={BUTTON_CLASS}
      >
        <FcGoogle aria-hidden="true" className="size-5 shrink-0" />
        {googleMutation.isPending ? "Connecting..." : "Continue with Google"}
      </button>

      {message && (
        <p className="ui-input-error" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

export default function GoogleSignInButton(props: GoogleSignInButtonProps) {
  // Without a client ID the Google hook cannot work, so show a clear
  // disabled state instead of a button that fails silently.
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div>
        <button type="button" disabled className={BUTTON_CLASS}>
          <FcGoogle aria-hidden="true" className="size-5 shrink-0" />
          Continue with Google
        </button>
        <p className="ui-input-error" role="alert">
          Google sign-in isn’t configured yet.
        </p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleButton {...props} />
    </GoogleOAuthProvider>
  );
}
