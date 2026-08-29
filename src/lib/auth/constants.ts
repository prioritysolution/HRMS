export const AUTH_LOCAL_USERS_KEY = "hrms_local_users";
/** Match Auth API Bearer token lifetime (8 hours). */
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 8;

export const AUTH_PUBLIC_PATHS = [
  "/login",
  "/signin",
  "/forgot-password",
  "/reset-password",
  "/verification",
] as const;

export const DEFAULT_AUTH_REDIRECT = "/dashboard";
export const SIGN_IN_PATH = "/login";

export function isAuthPublicPath(pathname: string): boolean {
  return AUTH_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
