import { appendOrgIdQuery, getCurrentOrgId, resolveOrgId } from "@/lib/auth/org-context";
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

export function roleToRow(record: RoleRecord, orgName = ""): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const roleId = readValue(source, ["Role_Id", "role_id", "id"]);
  const orgId = readValue(source, ["Org_Id", "org_id"]);
  const isAdmin = toAdminFlag(readValue(source, ["Is_Admin", "is_admin", "IsAdmin"]));

  return {
    id: String(roleId ?? ""),
    Role_Id: Number(roleId ?? 0),
    Org_Id: Number(orgId ?? 0) || "",
    Org_Name: orgName || optionalText(readValue(source, ["Org_Name", "org_name"])),
    Role_Code: optionalText(readValue(source, ["Role_Code", "role_code"])),
    Role_Name: optionalText(readValue(source, ["Role_Name", "role_name"])),
    Is_Admin: isAdmin === 1,
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
    Remarks: optionalText(readValue(source, ["Remarks", "remarks"])),
  };
}

export function rowToRolePayload(row: HrmsRow): RoleWritePayload {
  const orgId = resolveOrgId(row.Org_Id);
  const roleCode = String(row.Role_Code ?? "").trim();
  const remarks = String(row.Remarks ?? "").trim();

  return {
    ...(orgId ? { org_id: orgId } : {}),
    ...(roleCode ? { role_code: roleCode } : {}),
    role_name: String(row.Role_Name ?? "").trim(),
    is_admin: toAdminFlag(row.Is_Admin),
    status: toOrganizationStatus(row.Status),
    ...(remarks ? { remarks } : { remarks: null }),
  };
}

function withListQuery(basePath: string, query?: RoleListQuery) {
  const params = new URLSearchParams();
  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined) params.set("org_id", String(orgId));
  if (query?.status !== undefined) params.set("status", String(query.status));
  if (query?.is_admin !== undefined) params.set("is_admin", String(query.is_admin));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const roleService = {
  list: async (query?: RoleListQuery, orgNameById?: Map<number, string>) => {
    const payload = await apiClient.get<unknown>(withListQuery(API_ENDPOINTS.role.list, query));
    return asRoleList(payload).map((record) => {
      const source = record as unknown as Record<string, unknown>;
      const orgId = Number(readValue(source, ["Org_Id", "org_id"]) ?? 0);
      const orgName = orgNameById?.get(orgId) ?? "";
      return roleToRow(record, orgName);
    });
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.role.get(id));
    return roleToRow(asRole(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.role.create,
      rowToRolePayload(row),
    );
    return roleToRow(asRole(payload), String(row.Org_Name ?? ""));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.role.update(id),
      rowToRolePayload(row),
    );
    return roleToRow(asRole(payload), String(row.Org_Name ?? ""));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      appendOrgIdQuery(API_ENDPOINTS.role.delete(id)),
      { unwrap: false },
    ),
};
