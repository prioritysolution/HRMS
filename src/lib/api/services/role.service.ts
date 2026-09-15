import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { RoleListQuery, RoleRecord, RoleWritePayload } from "@/lib/api/types";
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

function toAdminFlag(value: unknown): 0 | 1 {
  if (value === 0 || value === "0" || value === false || value === "false") return 0;
  if (value === 1 || value === "1" || value === true || value === "true") return 1;
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  if (text === "yes" || text === "admin") return 1;
  return 0;
}

function asRoleList(payload: unknown): RoleRecord[] {
  if (Array.isArray(payload)) return payload as RoleRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as RoleRecord[];
  return [];
}

function asRole(payload: unknown): RoleRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as RoleRecord;
}

export function roleToRow(record: RoleRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const roleId = readValue(source, ["Id", "Role_Id", "role_id", "id"]);
  const isAdmin = toAdminFlag(readValue(source, ["Is_Admin", "is_admin", "IsAdmin"]));

  return {
    id: String(roleId ?? ""),
    Role_Id: Number(roleId ?? 0),
    Role_Name: optionalText(readValue(source, ["Role_Name", "role_name"])),
    Is_Admin: isAdmin === 1,
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
    Created_at: optionalText(readValue(source, ["Created_at", "created_at"])),
  };
}

export function rowToRolePayload(row: HrmsRow): RoleWritePayload {
  return {
    role_name: String(row.Role_Name ?? "").trim(),
    is_admin: toAdminFlag(row.Is_Admin),
    status: toOrganizationStatus(row.Status),
  };
}

function withListQuery(basePath: string, query?: RoleListQuery) {
  const params = new URLSearchParams();
  if (query?.role_id !== undefined) params.set("role_id", String(query.role_id));
  const roleName = query?.role_name ?? query?.search;
  if (roleName) params.set("role_name", roleName);
  if (query?.status !== undefined) params.set("status", String(query.status));
  if (query?.is_admin !== undefined) params.set("is_admin", String(query.is_admin));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const roleService = {
  list: async (query?: RoleListQuery) => {
    const payload = await apiClient.get<unknown>(withListQuery(API_ENDPOINTS.role.list, query));
    return asRoleList(payload).map((record) => roleToRow(record));
  },

  getById: async (id: string | number) => {
    const rows = await roleService.list({ role_id: Number(id) });
    const match = rows.find((row) => String(row.id) === String(id));
    if (!match) {
      throw new Error("Role not found");
    }
    return match;
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.role.create,
      rowToRolePayload(row),
    );
    return roleToRow(asRole(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.role.update(id),
      rowToRolePayload(row),
    );
    return roleToRow(asRole(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.role.delete(id),
      { unwrap: false },
    ),
};
