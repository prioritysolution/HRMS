import { enrichAuthUserWithOrgId } from "@/lib/auth/org-context";
import { ApiError, apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ApiMessageResponse,
  AuthMeProfile,
  AuthMeRole,
  AuthResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "@/lib/api/types";
import { registerLocal } from "@/lib/auth/local-auth";
import { clearAccessToken, getAccessToken, getStoredUser, setSession, setStoredUser } from "@/lib/auth/session";
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

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function parseAuthMeRoles(value: unknown): AuthMeRole[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;

      const roleId = readNumber(record, ["role_id", "Role_Id", "roleId"]);
      const roleName = readString(record, ["role_name", "Role_Name", "roleName"]);
      if (roleId === undefined || !roleName) return null;

      return {
        roleId,
        roleName,
        isAdmin: readBoolean(record, ["is_admin", "Is_Admin", "isAdmin"]) ?? false,
      };
    })
    .filter((role): role is AuthMeRole => role !== null);
}

export function parseAuthMeProfile(payload: unknown): AuthMeProfile | null {
  const record = asRecord(payload);
  if (!record) return null;

  const data = asRecord(record.data) ?? record;
  const userId = readNumber(data, ["user_id", "User_Id", "userId", "id"]);
  const userName = readString(data, ["user_name", "User_Name", "userName"]);
  if (userId === undefined || !userName) return null;

  const roleId = readNumber(data, ["role_id", "Role_Id", "roleId"]) ?? 0;
  const roleName =
    readString(data, ["role_name", "Role_Name", "roleName"]) ?? "User";
  const orgId = readNumber(data, ["org_id", "Org_Id", "orgId"]) ?? 0;
  const branchId = readNumber(data, ["branch_id", "Branch_Id", "branchId"]) ?? 0;
  const employeeId = readNumber(data, ["employee_id", "Employee_Id", "employeeId"]);

  return {
    userId,
    userName,
    roleId,
    roleName,
    isAdmin: readBoolean(data, ["is_admin", "Is_Admin", "isAdmin"]) ?? false,
    roles: parseAuthMeRoles(data.roles),
    orgId,
    orgCode: readString(data, ["org_code", "Org_Code", "orgCode"]) ?? "",
    orgName: readString(data, ["org_name", "Org_Name", "orgName"]) ?? "",
    orgLogo: readString(data, ["org_logo", "Org_Logo", "orgLogo"]),
    orgSchema: readString(data, ["org_schema", "Org_Schema", "orgSchema"]) ?? "",
    branchId,
    branchCode: readString(data, ["branch_code", "Branch_Code", "branchCode"]) ?? "",
    branchName: readString(data, ["branch_name", "Branch_Name", "branchName"]) ?? "",
    employeeId: employeeId ?? null,
    employeeCode: readString(data, ["employee_code", "Employee_Code", "employeeCode"]),
    displayName:
      readString(data, ["display_name", "Display_Name", "displayName"]) ?? userName,
    firstName: readString(data, ["first_name", "First_Name", "firstName"]),
    lastName: readString(data, ["last_name", "Last_Name", "lastName"]),
    email: readString(data, ["email", "Email"]),
    mobile: readString(data, ["mobile", "Mobile", "contact", "Contact"]),
    photoPath: readString(data, ["photo_path", "Photo_Path", "photoPath"]),
    loginStatus:
      readString(data, ["login_status", "Login_Status", "loginStatus"]) ?? "",
  };
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
  const user = enrichAuthUserWithOrgId(response.user, response.token);
  setSession(response.token, user);
  return { ...response, user };
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

      const enriched = enrichAuthUserWithOrgId(
        enrichAuthUser(
          { ...stored, ...user },
          raw,
          stored?.userName ?? "",
        ),
        getAccessToken(),
      );
      setStoredUser(enriched);
      return enriched;
    } catch {
      return stored;
    }
  },

  getMeProfile: async (): Promise<AuthMeProfile | null> => {
    try {
      const raw = await apiClient.get<unknown>(API_ENDPOINTS.auth.me, { unwrap: false });
      return parseAuthMeProfile(raw);
    } catch {
      return null;
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
