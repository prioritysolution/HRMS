import type { AuthUser } from "@/lib/api/types";
import { AUTH_SESSION_MAX_AGE } from "@/lib/auth/constants";
import { env, getAuthTokenKey, getAuthUserStorageKey } from "@/lib/env";
import { clearMenuCache } from "@/lib/menu/menu-cache";
import { clearSupportSession } from "@/lib/support/client";

function cookieName(): string {
  return getAuthTokenKey() || env.authTokenKey;
}

function userStorageKey(): string {
  return getAuthUserStorageKey();
}

function meStorageKey(): string {
  return `${getAuthUserStorageKey()}_me`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const encoded = encodeURIComponent(name);
  const match = document.cookie.match(new RegExp(`(?:^|; )${encoded}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const key = cookieName();
  const fromStorage = localStorage.getItem(key);
  const fromCookie = readCookie(key);
  const token = fromStorage || fromCookie;
  if (token && !fromCookie) writeCookie(key, token, AUTH_SESSION_MAX_AGE);
  if (token && !fromStorage) localStorage.setItem(key, token);
  return token;
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  const key = cookieName();
  localStorage.setItem(key, token);
  writeCookie(key, token, AUTH_SESSION_MAX_AGE);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(userStorageKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(userStorageKey(), JSON.stringify(user));
}

export function setStoredMeData(data: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(meStorageKey(), JSON.stringify(data));
}

export function getStoredMeData(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(meStorageKey());
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function setSession(token: string, user?: AuthUser): void {
  setAccessToken(token);
  if (user) setStoredUser(user);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(cookieName());
  localStorage.removeItem(userStorageKey());
  localStorage.removeItem(meStorageKey());
  clearCookie(cookieName());
  clearMenuCache();
  clearSupportSession();
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
