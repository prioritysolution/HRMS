import { appendOrgIdQuery, getCurrentOrgId, resolveOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { GradeListQuery, GradeRecord, GradeWritePayload } from "@/lib/api/types";
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

function toSalaryNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asGradeList(payload: unknown): GradeRecord[] {
  if (Array.isArray(payload)) return payload as GradeRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as GradeRecord[];
  return [];
}

function asGrade(payload: unknown): GradeRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as GradeRecord;
}

export function gradeToRow(record: GradeRecord, orgName = ""): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const gradeId = readValue(source, ["Grade_Id", "grade_id", "id"]);
  const orgId = readValue(source, ["Org_Id", "org_id"]);

  return {
    id: String(gradeId ?? ""),
    Grade_Id: Number(gradeId ?? 0),
    Org_Id: Number(orgId ?? 0),
    Org_Name: orgName || optionalText(readValue(source, ["Org_Name", "org_name"])) || "",
    Grade_Code: String(readValue(source, ["Grade_Code", "grade_code"]) ?? ""),
    Grade_Name: String(readValue(source, ["Grade_Name", "grade_name"]) ?? ""),
    Min_salary: toSalaryNumber(readValue(source, ["Min_salary", "min_salary"])),
    Max_salary: toSalaryNumber(readValue(source, ["Max_salary", "max_salary"])),
    Pay_Band: optionalText(readValue(source, ["Pay_Band", "pay_band"])) ?? "",
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
  };
}

export function rowToGradePayload(row: HrmsRow): GradeWritePayload {
  return {
    org_id: resolveOrgId(row.Org_Id),
    grade_code: String(row.Grade_Code ?? "").trim(),
    grade_name: String(row.Grade_Name ?? "").trim(),
    min_salary: toSalaryNumber(row.Min_salary),
    max_salary: toSalaryNumber(row.Max_salary),
    pay_band: optionalText(row.Pay_Band),
    status: toOrganizationStatus(row.Status),
  };
}

function withListQuery(basePath: string, query?: GradeListQuery) {
  const params = new URLSearchParams();
  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined) params.set("org_id", String(orgId));
  if (query?.status !== undefined) params.set("status", String(query.status));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const gradeService = {
  list: async (query?: GradeListQuery, orgNameById?: Map<number, string>) => {
    const payload = await apiClient.get<unknown>(withListQuery(API_ENDPOINTS.grade.list, query));
    return asGradeList(payload).map((record) => {
      const orgId = Number((record as unknown as Record<string, unknown>).Org_Id ?? 0);
      const orgName = orgNameById?.get(orgId) ?? "";
      return gradeToRow(record, orgName);
    });
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.grade.get(id));
    return gradeToRow(asGrade(payload));
  },

  getByCode: async (orgId: string | number, code: string) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.grade.getByCode(orgId, code));
    return gradeToRow(asGrade(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(API_ENDPOINTS.grade.create, rowToGradePayload(row));
    return gradeToRow(asGrade(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.grade.update(id),
      rowToGradePayload(row),
    );
    return gradeToRow(asGrade(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      appendOrgIdQuery(API_ENDPOINTS.grade.delete(id)),
      { unwrap: false },
    ),
};
