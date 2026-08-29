import { ApiError, apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ApiMessageResponse,
  AuthResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "@/lib/api/types";
import { registerLocal } from "@/lib/auth/local-auth";
import { clearAccessToken, getStoredUser, setSession, setStoredUser } from "@/lib/auth/session";
import { extractAccessToken, extractAuthUser } from "@/lib/auth/token";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function readBoolean(record: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1") return true;
    if (value === 0 || value === "0") return false;
  }
  return undefined;
}

function enrichAuthUser(
  user: AuthUser,
  payload: unknown,
  fallbackUserName = "",
): AuthUser {
  const record = asRecord(payload) ?? {};
  const data = asRecord(record.data);
  const userRecord =
    asRecord(record.user) ??
    asRecord(data?.user) ??
    data ??
    record;

  return {
    ...user,
    roleId: readNumber(userRecord, ["role_id", "Role_Id", "roleId"]) ?? user.roleId,
    orgId: readNumber(userRecord, ["org_id", "Org_Id", "orgId"]) ?? user.orgId,
    isAdmin: readBoolean(userRecord, ["is_admin", "Is_Admin", "isAdmin"]) ?? user.isAdmin,
    userName:
      user.userName ||
      fallbackUserName ||
      undefined,
  };
}

function normalizeAuthPayload(payload: unknown, fallbackUserName = ""): AuthResponse {
  const record = asRecord(payload) ?? {};
  const data = asRecord(record.data);
  const source = data ?? record;

  const token = extractAccessToken(payload);
  if (!token) {
    throw new ApiError("Login succeeded but no access token was returned.", 500);
  }

  const baseUser =
    extractAuthUser(payload, fallbackUserName) ??
    ({
      id: "user",
      name: fallbackUserName || "User",
      email: fallbackUserName,
      userName: fallbackUserName || undefined,
    } satisfies AuthUser);

  const expiresIn = readNumber(source, ["expires_in", "expiresIn"]);
  const tokenType =
    typeof source.token_type === "string"
      ? source.token_type
      : typeof source.tokenType === "string"
        ? source.tokenType
        : undefined;

  return {
    token,
    tokenType,
    expiresIn,
    user: enrichAuthUser(baseUser, payload, fallbackUserName),
  };
}

function persistAuth(response: AuthResponse): AuthResponse {
  setSession(response.token, response.user);
  return response;
}

export const authService = {
  login: async (payload: LoginRequest) => {
    const raw = await apiClient.post<unknown>(
      API_ENDPOINTS.auth.login,
      {
        user_name: payload.user_name.trim(),
        password: payload.password,
      },
      { auth: false, unwrap: false },
    );
    return persistAuth(normalizeAuthPayload(raw, payload.user_name.trim()));
  },

  register: async (payload: RegisterRequest) => persistAuth(await registerLocal(payload)),

  logout: async () => {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout, undefined, { unwrap: false });
    } catch {
      // Always clear local session even if the API call fails.
    } finally {
      clearAccessToken();
    }
  },

  me: async (): Promise<AuthUser | null> => {
    const stored = getStoredUser();
    try {
      const raw = await apiClient.get<unknown>(API_ENDPOINTS.auth.me, { unwrap: false });
      const user = extractAuthUser(raw, stored?.email ?? stored?.userName ?? "");
      if (!user) return stored;

      const enriched = enrichAuthUser(
        { ...stored, ...user },
        raw,
        stored?.userName ?? "",
      );
      setStoredUser(enriched);
      return enriched;
    } catch {
      return stored;
    }
  },

  forgotPassword: async (_payload: ForgotPasswordRequest): Promise<ApiMessageResponse> => ({
    message: "Password reset is not available yet.",
  }),

  verifyOtp: async (_payload: VerifyOtpRequest): Promise<ApiMessageResponse> => ({
    message: "OTP verification is not available yet.",
  }),

  resetPassword: async (_payload: ResetPasswordRequest): Promise<ApiMessageResponse> => ({
    message: "Password reset is not available yet.",
  }),
};
