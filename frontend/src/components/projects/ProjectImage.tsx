"use client";

import { useQuery } from "@tanstack/react-query";
import { ImageOff } from "lucide-react";

import { fetchProjectImage } from "@/lib/api/projects";

type ProjectImageProps = {
  projectId: string;
  alt: string;
  fit?: "cover" | "contain";
};

/** Loads the private reference image through the API (the session cookie authorizes it). */
export default function ProjectImage({
  projectId,
  alt,
  fit = "cover",
}: ProjectImageProps) {
  const { data: src, isError } = useQuery({
    queryKey: ["project-image", projectId],
    queryFn: async () => URL.createObjectURL(await fetchProjectImage(projectId)),
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