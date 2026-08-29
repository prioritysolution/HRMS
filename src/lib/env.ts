function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api").replace(
    /\/$/,
    "",
  ),
  apiTimeoutMs: readNumber(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 30000),
  authTokenKey: (process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "hrms_access_token").trim() || "hrms_access_token",
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
} as const;

export function getApiOrigin(): string {
  return env.apiBaseUrl.replace(/\/api(?:\/v\d+)?$/i, "").replace(/\/$/, "");
}

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${env.apiBaseUrl}${normalizedPath}`;
}

export function resolvePublicFileUrl(path: string, folder = "storage/organizations/logos"): string {
  const value = path.trim();
  if (!value) return "";
  if (/^(https?:|blob:|data:)/i.test(value)) return value;

  const origin = getApiOrigin();
  if (value.startsWith("/")) return `${origin}${value}`;
  if (value.includes("/")) return `${origin}/${value.replace(/^\/+/, "")}`;
  return `${origin}/${folder.replace(/^\/+|\/+$/g, "")}/${value}`;
}

export function getAuthTokenKey(): string {
  return env.authTokenKey;
}

export function getAuthUserStorageKey(): string {
  return `${env.authTokenKey}_user`;
}
