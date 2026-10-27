"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: ReactNode;
  error?: string;
  showPasswordToggle?: boolean;
};

export default function Input({
  autoComplete,
  className = "",
  disabled,
  error,
  id,
  label,
  name,
  required,
  showPasswordToggle = false,
  type = "text",
  ...inputProps
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy =
    [inputProps["aria-describedby"], error ? errorId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  const inputType =
    isPassword && showPasswordToggle && passwordVisible ? "text" : type;

  return (
    <div>
      <label className="ui-input-label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="ui-input-control h-12">
        <input
          {...inputProps}
          id={inputId}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={`ui-input-field h-full w-full px-4 text-sm text-foreground placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-60 ${
            showPasswordToggle && isPassword ? "pr-12" : ""
          } ${className}`}
        />

        {showPasswordToggle && isPassword && (
          <button
            type="button"
            className="ui-input-toggle"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
            onMouseDown={(event) => event.preventDefault()}
          >
            {passwordVisible ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
              >
                <path
                  d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
                <path
                  d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.2 0 8.6 4.5 9.5 6-.4.7-1.3 2-2.7 3.2M6.2 6.2C3.9 7.6 2.7 9.5 2.5 11c.9 1.5 4.3 6 9.5 6 1 0 2-.2 2.8-.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
              >
                <path
                  d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="ui-input-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
