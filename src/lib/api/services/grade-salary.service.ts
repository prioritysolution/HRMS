import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  GradeSalaryListQuery,
  GradeSalaryRecord,
  GradeSalaryWritePayload,
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

function toSalaryNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asGradeSalaryList(payload: unknown): GradeSalaryRecord[] {
  if (Array.isArray(payload)) return payload as GradeSalaryRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as GradeSalaryRecord[];
  return [];
}

function asGradeSalary(payload: unknown): GradeSalaryRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as GradeSalaryRecord;
}

export function gradeSalaryToRow(record: GradeSalaryRecord, gradeName = ""): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const incId = readValue(source, ["Inc_Id", "inc_id", "id"]);
  const gradeId = readValue(source, ["Grade_Id", "grade_id"]);

  return {
    id: String(incId ?? ""),
    Inc_Id: Number(incId ?? 0),
    Grade_Id: Number(gradeId ?? 0),
    Grade_Name: gradeName || optionalText(readValue(source, ["Grade_Name", "grade_name"])) || "",
    Scale_Frm: toSalaryNumber(readValue(source, ["Scale_Frm", "scale_frm"])),
    Yr_Inc: toSalaryNumber(readValue(source, ["Yr_Inc", "yr_inc"])),
    Scale_Upto: toSalaryNumber(readValue(source, ["Scale_Upto", "scale_upto"])),
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
  };
}

export function rowToGradeSalaryPayload(row: HrmsRow): GradeSalaryWritePayload {
  return {
    grade_id: Number(row.Grade_Id ?? 0),
    scale_frm: toSalaryNumber(row.Scale_Frm),
    yr_inc: toSalaryNumber(row.Yr_Inc),
    scale_upto: toSalaryNumber(row.Scale_Upto),
    status: toOrganizationStatus(row.Status),
  };
}

function withListQuery(basePath: string, query?: GradeSalaryListQuery) {
  const params = new URLSearchParams();
  if (query?.grade_id !== undefined) params.set("grade_id", String(query.grade_id));
  if (query?.status !== undefined) params.set("status", String(query.status));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const gradeSalaryService = {
  list: async (query?: GradeSalaryListQuery, gradeNameById?: Map<number, string>) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.gradeSalary.list, query),
    );
    return asGradeSalaryList(payload).map((record) => {
      const gradeId = Number((record as unknown as Record<string, unknown>).Grade_Id ?? 0);
      const gradeName = gradeNameById?.get(gradeId) ?? "";
      return gradeSalaryToRow(record, gradeName);
    });
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.gradeSalary.get(id));
    return gradeSalaryToRow(asGradeSalary(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.gradeSalary.create,
      rowToGradeSalaryPayload(row),
    );
    return gradeSalaryToRow(asGradeSalary(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.gradeSalary.update(id),
      rowToGradeSalaryPayload(row),
    );
    return gradeSalaryToRow(asGradeSalary(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.gradeSalary.delete(id),
      { unwrap: false },
    ),
};
