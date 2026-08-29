export const LOGO_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
export const LOGO_MAX_SIZE_MB = 2;
export const LOGO_MAX_SIZE_BYTES = LOGO_MAX_SIZE_MB * 1024 * 1024;
export const LOGO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const LOGO_ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export function isImageFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const hasAllowedExtension = LOGO_ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasAllowedType = !file.type || LOGO_ALLOWED_TYPES.includes(file.type);
  return hasAllowedExtension && hasAllowedType;
}

export function validateImageFile(
  file: File | null | undefined,
  options?: { required?: boolean; label?: string; maxSizeMb?: number },
): string | undefined {
  const label = options?.label ?? "File";
  const maxSizeMb = options?.maxSizeMb ?? LOGO_MAX_SIZE_MB;
  const maxBytes = maxSizeMb * 1024 * 1024;

  if (!file) {
    return options?.required ? `${label} is required.` : undefined;
  }

  if (!isImageFile(file)) {
    return `${label} must be a JPG, JPEG, PNG, or WEBP image.`;
  }

  if (file.size > maxBytes) {
    return `${label} must be ${maxSizeMb} MB or smaller.`;
  }

  return undefined;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
