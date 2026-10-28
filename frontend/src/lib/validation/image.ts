export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_IMAGE_MB = 10; // keep in sync with MAX_UPLOAD_MB on the backend

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only PNG, JPEG or WebP images are allowed.";
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return `The image is too large (maximum ${MAX_IMAGE_MB} MB).`;
  }
  return null;
}