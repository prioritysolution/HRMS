import { ApiError } from "@/lib/api/client";
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from "@/lib/api/types";
import { AUTH_LOCAL_USERS_KEY } from "@/lib/auth/constants";
import { generateAccessToken } from "@/lib/auth/token";

export const LOCAL_DEMO_ACCOUNT = {
  email: "admin@staffu.com",
  password: "Staffu@123",
  user: {
    id: "local-admin",
    name: "Joyce Neal",
    email: "admin@staffu.com",
    role: "Admin",
  } satisfies AuthUser,
};

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

function seedAccounts(): LocalAccount[] {
  return [
    {
      id: LOCAL_DEMO_ACCOUNT.user.id,
      name: LOCAL_DEMO_ACCOUNT.user.name,
      email: LOCAL_DEMO_ACCOUNT.user.email,
      password: LOCAL_DEMO_ACCOUNT.password,
      role: LOCAL_DEMO_ACCOUNT.user.role ?? "Admin",
    },
  ];
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

function allAccounts(): LocalAccount[] {
  const extras = readExtraAccounts().filter(
    (account) => account.email.toLowerCase() !== LOCAL_DEMO_ACCOUNT.email.toLowerCase(),
  );
  return [...seedAccounts(), ...extras];
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

export async function loginLocal(payload: LoginRequest): Promise<AuthResponse> {
  await delay(350);
  const email = payload.email.trim().toLowerCase();
  const account = allAccounts().find((item) => item.email.toLowerCase() === email);

  if (!account || account.password !== payload.password) {
    throw new ApiError("Invalid email or password.", 401);
  }

  return toAuthResponse(account);
}

export async function registerLocal(payload: RegisterRequest): Promise<AuthResponse> {
  await delay(350);
  const email = payload.email.trim().toLowerCase();
  const existing = allAccounts().find((item) => item.email.toLowerCase() === email);

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
