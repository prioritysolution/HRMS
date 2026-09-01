import type { AuthUser } from "@/lib/api/types";
import { getAccessToken, getStoredUser } from "@/lib/auth/session";
import { getAuthUserStorageKey } from "@/lib/env";

const ORG_ID_KEYS = ["orgId", "org_id", "Org_Id"] as const;

function parseOrgId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function readOrgIdFromRecord(record: Record<string, unknown>): number | undefined {
  for (const key of ORG_ID_KEYS) {
    const parsed = parseOrgId(record[key]);
    if (parsed) return parsed;
  }
  return undefined;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as unknown;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readOrgIdFromAccessToken(): number | undefined {
  const token = getAccessToken();
  if (!token) return undefined;

  const payload = decodeJwtPayload(token);
  if (!payload) return undefined;

  return readOrgIdFromRecord(payload);
}

function readOrgIdFromLocalStorage(): number | undefined {
  if (typeof window === "undefined") return undefined;

  const raw = localStorage.getItem(getAuthUserStorageKey());
  if (!raw) return undefined;

  try {
    return readOrgIdFromRecord(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

export function getCurrentOrgId(): number | undefined {
  if (typeof window === "undefined") return undefined;

  const storedUser = getStoredUser();
  if (storedUser) {
    const fromUser = readOrgIdFromRecord(storedUser as unknown as Record<string, unknown>);
    if (fromUser) return fromUser;
  }

  const fromStorage = readOrgIdFromLocalStorage();
  if (fromStorage) return fromStorage;

  return readOrgIdFromAccessToken();
}

export function resolveOrgId(explicit?: unknown): number {
  const fromExplicit = parseOrgId(explicit);
  if (fromExplicit) return fromExplicit;
  return getCurrentOrgId() ?? 0;
}

export function enrichAuthUserWithOrgId(user: AuthUser, token?: string | null): AuthUser {
  const existing = readOrgIdFromRecord(user as unknown as Record<string, unknown>);
  if (existing) return user;

  if (token) {
    const payload = decodeJwtPayload(token);
    const fromToken = payload ? readOrgIdFromRecord(payload) : undefined;
    if (fromToken) return { ...user, orgId: fromToken };
  }

  const fromSession = getCurrentOrgId();
  return fromSession ? { ...user, orgId: fromSession } : user;
}

export function applyOrgIdToRequestBody(body: unknown): unknown {
  if (body === undefined || body === null) return body;
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  if (typeof body !== "object" || Array.isArray(body)) return body;

  const record = body as Record<string, unknown>;
  if (!("org_id" in record)) return body;

  const resolved = resolveOrgId(record.org_id);
  if (resolved === record.org_id) return body;
  return { ...record, org_id: resolved };
}

export function appendOrgIdQuery(path: string): string {
  const orgId = getCurrentOrgId();
  if (!orgId) return path;
  if (path.includes("org_id=")) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}org_id=${orgId}`;
}
