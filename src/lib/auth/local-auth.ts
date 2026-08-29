import { ApiError } from "@/lib/api/client";
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from "@/lib/api/types";
import { AUTH_LOCAL_USERS_KEY } from "@/lib/auth/constants";
import { generateAccessToken } from "@/lib/auth/token";

type LocalAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readExtraAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(AUTH_LOCAL_USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeExtraAccounts(accounts: LocalAccount[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_LOCAL_USERS_KEY, JSON.stringify(accounts));
}

function toAuthUser(account: LocalAccount): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
  };
}

function toAuthResponse(account: LocalAccount): AuthResponse {
  const user = toAuthUser(account);
  return {
    token: generateAccessToken(user),
    user,
  };
}

/** Local register only — login uses the real Auth API. */
export async function registerLocal(payload: RegisterRequest): Promise<AuthResponse> {
  await delay(350);
  const email = payload.email.trim().toLowerCase();
  const existing = readExtraAccounts().find((item) => item.email.toLowerCase() === email);

  if (existing) {
    throw new ApiError("An account with this email already exists.", 422);
  }

  const account: LocalAccount = {
    id: `local-${Date.now()}`,
    name: payload.name.trim(),
    email: payload.email.trim(),
    password: payload.password,
    role: "Admin",
  };

  writeExtraAccounts([...readExtraAccounts(), account]);
  return toAuthResponse(account);
}

/** @deprecated Login is handled by the Auth API. Kept for type compatibility only. */
export async function loginLocal(_payload: LoginRequest): Promise<AuthResponse> {
  throw new ApiError("Static login is disabled. Use the Auth API.", 501);
}
