"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAssetBlob } from "@/lib/api/generation";

/**
 * The GLB is private, so the 3D loader cannot fetch it directly (it would
 * not send the session cookie). We download it through the API client and
 * hand the loader a local blob: URL instead.
 */
export function useModelUrl(assetId: string | null) {
  return useQuery({
    queryKey: ["model-file", assetId],
    queryFn: async () => URL.createObjectURL(await fetchAssetBlob(assetId!)),
    enabled: !!assetId,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    retry: 1,
  });
}