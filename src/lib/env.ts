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

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${env.apiBaseUrl}${normalizedPath}`;
}

export function getAuthTokenKey(): string {
  return env.authTokenKey;
}

export function getAuthUserStorageKey(): string {
  return `${env.authTokenKey}_user`;
}
