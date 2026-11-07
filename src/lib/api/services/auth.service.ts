import { enrichAuthUserWithOrgId } from "@/lib/auth/org-context";
import { ApiError, apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ApiMessageResponse,
  AuthMeProfile,
  AuthMeRole,
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "@/lib/api/types";
import { registerLocal } from "@/lib/auth/local-auth";
import { clearAccessToken, getAccessToken, getStoredUser, setSession, setStoredMeData, setStoredUser } from "@/lib/auth/session";
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
  const user = asRecord(data.user) ?? asRecord(data.User) ?? asRecord(record.user);
  const source = user ? { ...data, ...user } : data;
  const nestedEmp = asRecord(source.employee) ?? asRecord(source.Employee);
  const profile = asRecord(data.profile);
  const personal = asRecord(data.personal_details);
  const job = asRecord(data.job_details);
  const contact = asRecord(data.contact_address);

  const userId =
    readNumber(source, ["user_id", "User_Id", "userId", "id"]) ??
    readNumber(data, ["user_id", "User_Id", "userId", "id"]);
  const userName =
    readString(source, ["user_name", "User_Name", "userName"]) ??
    readString(data, ["user_name", "User_Name", "userName"]);
  if (userId === undefined || !userName) return null;

  const roleId = readNumber(source, ["role_id", "Role_Id", "roleId"]) ?? 0;
  const roleName =
    readString(source, ["role_name", "Role_Name", "roleName"]) ?? "User";
  const orgId = readNumber(source, ["org_id", "Org_Id", "orgId"]) ?? 0;
  const branchId = readNumber(source, ["branch_id", "Branch_Id", "branchId"]) ?? 0;
  const employeeId =
    readNumber(source, [
      "employee_id",
      "Employee_id",
      "Employee_Id",
      "employeeId",
      "emp_id",
      "Emp_Id",
      "Emp_id",
    ]) ??
    (nestedEmp
      ? readNumber(nestedEmp, [
          "id",
          "employee_id",
          "Employee_id",
          "Employee_Id",
          "emp_id",
        ])
      : undefined);

  return {
    userId,
    userName,
    roleId,
    roleName,
    isAdmin: readBoolean(source, ["is_admin", "Is_Admin", "isAdmin"]) ?? false,
    roles: parseAuthMeRoles(source.roles ?? data.roles),
    orgId,
    orgCode: readString(source, ["org_code", "Org_Code", "orgCode"]) ?? "",
    orgName: readString(source, ["org_name", "Org_Name", "orgName"]) ?? "",
    orgLogo: readString(source, ["org_logo", "Org_Logo", "orgLogo"]),
    orgSchema: readString(source, ["org_schema", "Org_Schema", "orgSchema"]) ?? "",
    branchId,
    branchCode: readString(source, ["branch_code", "Branch_Code", "branchCode"]) ?? "",
    branchName: readString(source, ["branch_name", "Branch_Name", "branchName"]) ?? "",
    employeeId: employeeId ?? null,
    employeeCode:
      (readString(source, [
        "employee_code",
        "Employee_code",
        "Employee_Code",
        "employeeCode",
        "emp_code",
        "Emp_Code",
        "Emp_code",
      ]) ??
      (nestedEmp
        ? readString(nestedEmp, [
            "code",
            "employee_code",
            "Employee_code",
            "Employee_Code",
          ])
        : null)) ?? null,
    displayName:
      (profile && readString(profile, ["full_name"])) ?? readString(source, ["display_name", "Display_Name", "displayName"]) ?? userName,
    firstName: (personal && readString(personal, ["first_name"])) ?? readString(source, ["first_name", "First_Name", "firstName"]),
    lastName: (personal && readString(personal, ["last_name"])) ?? readString(source, ["last_name", "Last_Name", "lastName"]),
    email: (contact && readString(contact, ["email"])) ?? readString(source, ["email", "Email"]),
    mobile: (contact && readString(contact, ["mobile"])) ?? readString(source, [
      "userPhone",
      "user_phone",
      "User_Phone",
      "mobile",
      "Mobile",
      "phone",
      "Phone",
      "contact",
      "Contact",
      "userMob",
      "user_mob",
      "User_Mob",
    ]),
    photoPath: readString(source, ["photo_path", "Photo_Path", "photoPath"]),
    photoUrl: (profile && readString(profile, ["photo_url"])) ?? readString(source, ["photo_url"]),
    employeeStatus: profile ? readString(profile, ["status_label"]) : null,
    personalDetails: personal,
    jobDetails: job,
    contactAddress: contact,
    loginStatus:
      readString(source, ["login_status", "Login_Status", "loginStatus"]) ?? "",
  };
}

function persistMePayload(payload: unknown) {
  const record = asRecord(payload);
  if (!record) return;

  const data = asRecord(record.data);
  const nestedUser = data ? asRecord(data.user) ?? asRecord(data.User) : asRecord(record.user);
  const isProfile = (value: Record<string, unknown> | null) =>
    Boolean(
      value &&
        (value.user_id != null ||
          value.User_Id != null ||
          value.display_name != null ||
          value.employee_id != null ||
          value.Employee_id != null ||
          value.Employee_Id != null),
    );

  const profile = isProfile(data) ? data : isProfile(nestedUser) ? nestedUser : isProfile(record) ? record : null;
  if (profile) setStoredMeData(profile);
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
    name:
      readString(userRecord, ["display_name", "Display_Name", "displayName", "name"]) ||
      user.name,
    role:
      readString(userRecord, ["role_name", "Role_Name", "role"]) ||
      user.role,
    photoPath:
      readString(userRecord, ["photo_path", "Photo_Path", "photoPath", "photo"]) ??
      user.photoPath ??
      null,
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
    const deviceKey = "hrms_device_id";
    let deviceId = localStorage.getItem(deviceKey);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(deviceKey, deviceId);
    }
    const raw = await apiClient.post<unknown>(
      API_ENDPOINTS.auth.login,
      {
        user_name: payload.user_name.trim(),
        password: payload.password,
        device_id: deviceId,
        device_name: `${/Edg\//.test(navigator.userAgent) ? "Edge" : /Firefox\//.test(navigator.userAgent) ? "Firefox" : /Chrome\//.test(navigator.userAgent) ? "Chrome" : /Safari\//.test(navigator.userAgent) ? "Safari" : "Browser"} on ${/Windows/.test(navigator.userAgent) ? "Windows" : /Android/.test(navigator.userAgent) ? "Android" : /iPhone|iPad/.test(navigator.userAgent) ? "iOS" : /Mac/.test(navigator.userAgent) ? "macOS" : /Linux/.test(navigator.userAgent) ? "Linux" : "unknown device"}`,
        ...(payload.replace_existing_session ? { replace_existing_session: true, confirmation_token: payload.confirmation_token } : {}),
      },
      { auth: false, unwrap: false },
    );
    persistMePayload(raw);
    const session = persistAuth(normalizeAuthPayload(raw, payload.user_name.trim()));

    try {
      const me = await apiClient.get<unknown>(API_ENDPOINTS.auth.me, { unwrap: false });
      persistMePayload(me);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw error;
      // The login body was already saved when it included the profile.
    }

    return session;
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
      persistMePayload(raw);
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
      persistMePayload(raw);
      return parseAuthMeProfile(raw);
    } catch {
      return null;
    }
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<ApiMessageResponse> => {
    const raw = await apiClient.post<unknown>(
      API_ENDPOINTS.auth.changePassword,
      {
        current_password: payload.current_password,
        password: payload.password,
        password_confirmation: payload.password_confirmation,
      },
      { unwrap: false },
    );
    const record =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
    const message =
      (typeof record?.message === "string" && record.message) ||
      "Password changed successfully.";
    clearAccessToken();
    return { message };
  },

  uploadPhoto: async (file: File): Promise<void> => {
    const form = new FormData();
    form.append("photo", file);
    await apiClient.post(API_ENDPOINTS.auth.profilePhoto, form);
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
