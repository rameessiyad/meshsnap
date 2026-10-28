"use client";

import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_MB,
  validateImageFile,
} from "@/lib/validation/image";

type ImagePickerProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export default function ImagePicker({
  file,
  onChange,
  disabled = false,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Free the preview URL when the component goes away.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  function select(next: File | null) {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }

    if (!next) {
      setPreview(null);
      setError(null);
      onChange(null);
      return;
    }

    const problem = validateImageFile(next);
    if (problem) {
      setPreview(null);
      setError(problem);
      onChange(null);
      return;
    }

    urlRef.current = URL.createObjectURL(next);
    setPreview(urlRef.current);
    setError(null);
    onChange(next);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    select(event.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-surface-raised transition-colors ${
          dragging ? "border-primary" : "border-border"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Selected reference"
            className="h-full w-full object-contain"
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="landing-outline-button flex flex-col items-center gap-2 rounded-xl border border-transparent px-6 py-4 text-center text-sm text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ImagePlus className="size-8" aria-hidden="true" />
            <span className="font-medium">Click to choose an image</span>
            <span className="text-xs">
              or drag it here · PNG, JPEG or WebP · up to {MAX_IMAGE_MB} MB
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          select(e.target.files?.[0] ?? null);
          e.target.value = ""; // lets the same file be chosen again
        }}
      />

      <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-xs">
        {error ? (
          <p role="alert" className="text-red-400">
            {error}
          </p>
        ) : (
          <span className="truncate text-muted-foreground">
            {file ? file.name : "Use a clear photo of a single object."}
          </span>
        )}
        {file && !disabled && (
          <button
            type="button"
            onClick={() => select(null)}
            className="landing-outline-button shrink-0 rounded-md px-2 py-1 font-medium text-muted-foreground"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}