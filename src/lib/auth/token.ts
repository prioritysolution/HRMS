import type { AuthUser } from "@/lib/api/types";
import { AUTH_SESSION_MAX_AGE } from "@/lib/auth/constants";
import { env } from "@/lib/env";

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

export function generateAccessToken(user: AuthUser): string {
  const now = Math.floor(Date.now() / 1000);
  const nonce =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${now}-${Math.random().toString(36).slice(2)}`;

  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: env.authTokenKey,
      sub: String(user.id || "user"),
      email: user.email,
      name: user.name,
      role: user.role,
      iat: now,
      exp: now + AUTH_SESSION_MAX_AGE,
      jti: nonce,
    }),
  );
  const signature = toBase64Url(nonce);

  return `${header}.${payload}.${signature}`;
}

export function extractAccessToken(payload: unknown): string | null {
  const record = asRecord(payload);
  if (!record) return null;

  const direct = readString(record, ["token", "access_token", "accessToken", "plainTextToken"]);
  if (direct) return direct;

  const nested = extractAccessToken(record.data);
  if (nested) return nested;

  const authorisation = asRecord(record.authorisation) ?? asRecord(record.authorization);
  if (authorisation) {
    return readString(authorisation, ["token", "access_token", "accessToken"]);
  }

  return null;
}

export function extractAuthUser(payload: unknown, fallbackEmail = ""): AuthUser | null {
  const record = asRecord(payload);
  if (!record) return null;

  const data = asRecord(record.data);
  const candidates = [asRecord(record.user), asRecord(data?.user), data, record].filter(
    (item): item is Record<string, unknown> => Boolean(item),
  );

  for (const userRecord of candidates) {
    const email = readString(userRecord, ["email", "email_id"]) ?? fallbackEmail;
    const firstName = readString(userRecord, ["first_name", "firstName"]);
    const lastName = readString(userRecord, ["last_name", "lastName"]);
    const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const name =
      readString(userRecord, ["name", "full_name", "user_name", "username"]) ||
      combinedName ||
      (email ? email.split("@")[0] : "");
    const id = readString(userRecord, ["id", "user_id", "uuid"]);

    if (!email && !name && !id) continue;

    return {
      id: id ?? "user",
      name: name || "User",
      email,
      role: readString(userRecord, ["role", "user_type", "userType", "designation"]) ?? undefined,
    };
  }

  return null;
}
