export const AUTH_LOCAL_USERS_KEY = "hrms_local_users";
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const AUTH_PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verification",
] as const;

export const DEFAULT_AUTH_REDIRECT = "/dashboard";
export const SIGN_IN_PATH = "/signin";

export function isAuthPublicPath(pathname: string): boolean {
  return AUTH_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
