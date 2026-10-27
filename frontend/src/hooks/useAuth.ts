"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMe,
  login,
  logout,
  register,
  type AuthResponse,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";

// The signed-in user lives in the cache under this key (null = signed out).
export const SESSION_QUERY_KEY = ["session"] as const;

// Who is signed in? Resolves to the user, or null when there is no session.
export function useSession() {
  return useQuery<AuthUser | null, ApiError>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const result = await getMe();
      return result ? result.user : null;
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, ApiError, LoginPayload>({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, ApiError, RegisterPayload>({
    mutationFn: register,
    onSuccess: (data) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: logout,
    // Runs whether the request worked or not: the user is signed out locally
    // either way, so drop everything cached for them.
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
    },
  });
}
