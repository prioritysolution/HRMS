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
  options?: { required?: boolean; label?: string; maxSizeMb?: number; accept?: string },
): string | undefined {
  const label = options?.label ?? "File";
  const maxSizeMb = options?.maxSizeMb ?? LOGO_MAX_SIZE_MB;
  const maxBytes = maxSizeMb * 1024 * 1024;
  const accept = options?.accept ?? LOGO_ACCEPT;
  const acceptedTokens = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  const acceptedExtensions = acceptedTokens.filter((token) => token.startsWith("."));
  const acceptedMimeTypes = acceptedTokens.filter((token) => token.includes("/"));

  if (!file) {
    return options?.required ? `${label} is required.` : undefined;
  }

  const fileName = file.name.toLowerCase();
  const hasAllowedExtension =
    acceptedExtensions.length === 0 ||
    acceptedExtensions.some((ext) => fileName.endsWith(ext));
  const hasAllowedMimeType =
    acceptedMimeTypes.length === 0 ||
    !file.type ||
    acceptedMimeTypes.some((mimeType) =>
      mimeType.endsWith("/*")
        ? file.type.toLowerCase().startsWith(mimeType.replace("/*", "/"))
        : file.type.toLowerCase() === mimeType,
    );

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    const allowsPdf =
      acceptedExtensions.includes(".pdf") || acceptedMimeTypes.includes("application/pdf");
    return `${label} must be a JPG, JPEG, PNG, WEBP${allowsPdf ? ", or PDF" : ""} file.`;
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
