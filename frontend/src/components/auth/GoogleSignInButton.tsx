export default function GoogleSignInButton() {
  return (
    <button
      type="button"
      className="auth-google-button flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border-strong bg-surface-raised px-5 text-sm font-medium text-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5 shrink-0"
      >
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.57c2.08-1.91 3.27-4.72 3.27-8.09Z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.15A11 11 0 0 0 1 12c0 1.78.43 3.46 1.15 4.94l3.69-2.84Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.08 14.97 1 12 1a11 11 0 0 0-9.85 6.06l3.69 2.84C6.71 7.29 9.14 5.36 12 5.36Z"
        />
      </svg>
      Continue with Google
    </button>
  );
}
