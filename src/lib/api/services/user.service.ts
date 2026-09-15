import { getCurrentOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { UserListQuery, UserRecord, UserStatusPayload } from "@/lib/api/types";
import {
  toOrganizationStatus,
  toOrganizationStatusLabel,
} from "@/lib/api/services/organization.service";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function optionalText(value: unknown): string {
  if (value === undefined || value === null || value === false) return "";
  return String(value).trim();
}

function asUserList(payload: unknown): UserRecord[] {
  if (Array.isArray(payload)) return payload as UserRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as UserRecord[];
  return [];
}

function asUser(payload: unknown): UserRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as UserRecord;
}

export function userToRow(record: UserRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const userId = readValue(source, ["User_Id", "user_id", "id"]);
  const orgId = readValue(source, ["Org_Id", "org_id"]);
  const branchId = readValue(source, ["Branch_Id", "branch_id"]);
  const isActive = toOrganizationStatus(readValue(source, ["Is_Active", "is_active", "Status", "status"]));
  const loginStatus = optionalText(readValue(source, ["Login_Status", "login_status"])) || "LogOut";

  return {
    id: String(userId ?? ""),
    User_Id: Number(userId ?? 0),
    Org_Id: Number(orgId ?? 0) || "",
    Org_Cd: optionalText(readValue(source, ["Org_Cd", "org_cd"])),
    Org_Name: optionalText(readValue(source, ["Org_Name", "org_name"])),
    Branch_Id: Number(branchId ?? 0) || "",
    Branch_Code: optionalText(readValue(source, ["Branch_Code", "branch_code"])),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    User_Name: optionalText(readValue(source, ["User_Name", "user_name"])),
    Is_Active: isActive,
    Status: toOrganizationStatusLabel(isActive),
    Login_Status: loginStatus === "LogIn" || loginStatus.toLowerCase() === "login" ? "LogIn" : "LogOut",
    Created_at: optionalText(readValue(source, ["Created_at", "created_at"])),
  };
}

function withListQuery(basePath: string, query?: UserListQuery) {
  const params = new URLSearchParams();
  if (query?.user_id !== undefined) params.set("user_id", String(query.user_id));

  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined) params.set("org_id", String(orgId));

  if (query?.branch_id !== undefined) params.set("branch_id", String(query.branch_id));

  const userName = query?.user_name ?? query?.search;
  if (userName) params.set("user_name", userName);

  const active = query?.is_active ?? query?.status;
  if (active !== undefined) params.set("is_active", String(active));

  if (query?.login_status) params.set("login_status", query.login_status);

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const userService = {
  list: async (query?: UserListQuery) => {
    const payload = await apiClient.get<unknown>(withListQuery(API_ENDPOINTS.user.list, query));
    return asUserList(payload).map(userToRow);
  },

  updateStatus: async (id: string | number, status: 0 | 1) => {
    const body: UserStatusPayload = { status };
    const payload = await apiClient.put<unknown>(API_ENDPOINTS.user.updateStatus(id), body);
    return userToRow(asUser(payload));
  },
};
