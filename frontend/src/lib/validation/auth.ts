import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

// Trimmed and lowercased, like the backend, so A@x.com and a@x.com match.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .max(320, "Email must be 320 characters or fewer.")
  .email("Enter a valid email address.");

export const loginSchema = z.object({
  email: emailSchema,
  // No length rules on login: it should not reveal the password policy.
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(
      MAX_PASSWORD_LENGTH,
      `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`,
    ),
});

export const registerSchema = z.object({
  // Empty string is allowed; the form turns it into null before sending.
  display_name: z
    .string()
    .trim()
    .max(100, "Name must be 100 characters or fewer."),
  email: emailSchema,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(
      MAX_PASSWORD_LENGTH,
      `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`,
    )
    .refine((value) => value.trim().length > 0, {
      message: "Password cannot be only whitespace.",
    }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
