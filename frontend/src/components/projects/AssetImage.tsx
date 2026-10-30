"use client";

import { useQuery } from "@tanstack/react-query";
import { ImageOff } from "lucide-react";

import { fetchAssetBlob } from "@/lib/api/generation";

/** Loads a private image asset (like a model thumbnail) through the API. */
export default function AssetImage({
  assetId,
  alt,
  fit = "contain",
}: {
  assetId: string;
  alt: string;
  fit?: "cover" | "contain";
}) {
  const { data: src, isError } = useQuery({
    queryKey: ["asset-image", assetId],
    queryFn: async () => URL.createObjectURL(await fetchAssetBlob(assetId)),
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });

  if (isError) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <ImageOff className="size-6" aria-hidden="true" />
      </div>
    );
  }

  if (!src) {
    return <div className="h-full w-full animate-pulse bg-surface-raised" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
    />
  );
}
