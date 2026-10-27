"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { SESSION_QUERY_KEY } from "@/hooks/useAuth";
import {
  googleLogin,
  type AuthResponse,
  type GoogleLoginPayload,
} from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";

// Sends Google's one-time code to the backend and, on success, stores the
// signed-in user in the shared session cache (same as normal login).
export function useGoogleSignIn() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, ApiError, GoogleLoginPayload>({
    mutationFn: googleLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, data.user);
    },
  });
}