import { z } from "zod";

import { ApiError, apiClient, setCsrfToken } from "./client";

/* --------------------------- Response validation --------------------------- */

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  display_name: z.string().nullable(),
  role: z.string(),
  created_at: z.string(),
});

const authResponseSchema = z.object({
  user: userSchema,
  csrf_token: z.string().min(1),
});

export type AuthUser = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

/* --------------------------------- Payloads -------------------------------- */

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  display_name?: string | null;
  invite_code?: string | null;
};

/* --------------------------------- Helpers --------------------------------- */

// Confirm the server answered with the shape we expect, then keep the CSRF
// token so later write requests can send it.
function parseAuthResponse(data: unknown): AuthResponse {
  const parsed = authResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new ApiError(
      "The server returned an invalid authentication response.",
      { status: null },
    );
  }

  setCsrfToken(parsed.data.csrf_token);
  return parsed.data;
}

/* ------------------------------- API calls --------------------------------- */

export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const response = await apiClient.post<unknown>("/auth/register", payload);
  return parseAuthResponse(response.data);
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<unknown>("/auth/login", payload);
  return parseAuthResponse(response.data);
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    // Forget the token even if the request failed (for example, the session
    // had already expired). The user is signed out on this device either way.
    setCsrfToken(null);
  }
}

// Returns the signed-in user, or null when there is no valid session.
// Also refreshes the CSRF token, which is lost after a page reload.
export async function getMe(): Promise<AuthResponse | null> {
  try {
    const response = await apiClient.get<unknown>("/auth/me");
    return parseAuthResponse(response.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setCsrfToken(null);
      return null;
    }
    throw error;
  }
}

//google sign in
export type GoogleLoginPayload = {
  code: string;
};

export async function googleLogin(
  payload: GoogleLoginPayload,
): Promise<AuthResponse> {
  const response = await apiClient.post<unknown>("/auth/google", payload);
  return parseAuthResponse(response.data);
}
