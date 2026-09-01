import { appendOrgIdQuery, getCurrentOrgId, resolveOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  DepartmentListQuery,
  DepartmentRecord,
  DepartmentWritePayload,
} from "@/lib/api/types";
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

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === false) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function asDepartmentList(payload: unknown): DepartmentRecord[] {
  if (Array.isArray(payload)) return payload as DepartmentRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as DepartmentRecord[];
  return [];
}

function asDepartment(payload: unknown): DepartmentRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as DepartmentRecord;
}

export function departmentToRow(record: DepartmentRecord, orgName = ""): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const deptId = readValue(source, ["Dept_Id", "dept_id", "id"]);
  const orgId = readValue(source, ["Org_Id", "org_id"]);

  return {
    id: String(deptId ?? ""),
    Dept_Id: Number(deptId ?? 0),
    Org_Id: Number(orgId ?? 0),
    Org_Name: orgName || optionalText(readValue(source, ["Org_Name", "org_name"])) || "",
    Dept_Cd: String(readValue(source, ["Dept_Cd", "dept_cd"]) ?? ""),
    Dept_Name: String(readValue(source, ["Dept_Name", "dept_name"]) ?? ""),
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
  };
}

export function rowToDepartmentPayload(row: HrmsRow): DepartmentWritePayload {
  return {
    org_id: resolveOrgId(row.Org_Id),
    dept_cd: String(row.Dept_Cd ?? "").trim(),
    dept_name: String(row.Dept_Name ?? "").trim(),
    status: toOrganizationStatus(row.Status),
  };
}

function withListQuery(basePath: string, query?: DepartmentListQuery) {
  const params = new URLSearchParams();
  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined) params.set("org_id", String(orgId));
  if (query?.status !== undefined) params.set("status", String(query.status));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const departmentService = {
  list: async (query?: DepartmentListQuery, orgNameById?: Map<number, string>) => {
    const payload = await apiClient.get<unknown>(withListQuery(API_ENDPOINTS.department.list, query));
    return asDepartmentList(payload).map((record) => {
      const orgId = Number((record as unknown as Record<string, unknown>).Org_Id ?? 0);
      const orgName = orgNameById?.get(orgId) ?? "";
      return departmentToRow(record, orgName);
    });
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.department.get(id));
    return departmentToRow(asDepartment(payload));
  },

  getByCode: async (orgId: string | number, code: string) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.department.getByCode(orgId, code));
    return departmentToRow(asDepartment(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.department.create,
      rowToDepartmentPayload(row),
    );
    return departmentToRow(asDepartment(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.department.update(id),
      rowToDepartmentPayload(row),
    );
    return departmentToRow(asDepartment(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      appendOrgIdQuery(API_ENDPOINTS.department.delete(id)),
      { unwrap: false },
    ),
};
