import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  EmploymentTypeListQuery,
  EmploymentTypeRecord,
  EmploymentTypeWritePayload,
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

function toPayrollFlag(value: unknown): 0 | 1 {
  if (value === 0 || value === "0" || value === false || value === "false") return 0;
  return 1;
}

function asEmploymentTypeList(payload: unknown): EmploymentTypeRecord[] {
  if (Array.isArray(payload)) return payload as EmploymentTypeRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as EmploymentTypeRecord[];
  return [];
}

function asEmploymentType(payload: unknown): EmploymentTypeRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as EmploymentTypeRecord;
}

export function employmentTypeToRow(record: EmploymentTypeRecord, orgName = ""): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const empTypeId = readValue(source, ["Emp_type_id", "emp_type_id", "id"]);
  const orgId = readValue(source, ["Org_Id", "org_id"]);

  return {
    id: String(empTypeId ?? ""),
    Emp_type_id: Number(empTypeId ?? 0),
    Org_Id: Number(orgId ?? 0),
    Org_Name: orgName || optionalText(readValue(source, ["Org_Name", "org_name"])) || "",
    Type_code: String(readValue(source, ["Type_code", "type_code"]) ?? ""),
    Type_name: String(readValue(source, ["Type_name", "type_name"]) ?? ""),
    Is_payroll_applicable: toPayrollFlag(
      readValue(source, ["Is_payroll_applicable", "is_payroll_applicable"]),
    ) === 1,
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
  };
}

export function rowToEmploymentTypePayload(row: HrmsRow): EmploymentTypeWritePayload {
  return {
    org_id: Number(row.Org_Id ?? 0),
    type_code: String(row.Type_code ?? "").trim(),
    type_name: String(row.Type_name ?? "").trim(),
    is_payroll_applicable: toPayrollFlag(row.Is_payroll_applicable),
    status: toOrganizationStatus(row.Status),
  };
}

function withListQuery(basePath: string, query?: EmploymentTypeListQuery) {
  const params = new URLSearchParams();
  if (query?.org_id !== undefined) params.set("org_id", String(query.org_id));
  if (query?.status !== undefined) params.set("status", String(query.status));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const employmentTypeService = {
  list: async (query?: EmploymentTypeListQuery, orgNameById?: Map<number, string>) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.employmentType.list, query),
    );
    return asEmploymentTypeList(payload).map((record) => {
      const source = record as unknown as Record<string, unknown>;
      const orgId = Number(readValue(source, ["Org_Id", "org_id"]) ?? 0);
      const orgName = orgNameById?.get(orgId) ?? "";
      return employmentTypeToRow(record, orgName);
    });
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.employmentType.get(id));
    return employmentTypeToRow(asEmploymentType(payload));
  },

  getByCode: async (orgId: string | number, code: string) => {
    const payload = await apiClient.get<unknown>(
      API_ENDPOINTS.employmentType.getByCode(orgId, code),
    );
    return employmentTypeToRow(asEmploymentType(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.employmentType.create,
      rowToEmploymentTypePayload(row),
    );
    return employmentTypeToRow(asEmploymentType(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.employmentType.update(id),
      rowToEmploymentTypePayload(row),
    );
    return employmentTypeToRow(asEmploymentType(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.employmentType.delete(id),
      { unwrap: false },
    ),
};
