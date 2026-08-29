import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  WorkShiftListQuery,
  WorkShiftRecord,
  WorkShiftWritePayload,
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

function toDecimalNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTimeForDisplay(value: unknown): string {
  const text = optionalText(value);
  if (!text) return "";
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return text;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function formatTimeForApi(value: unknown): string {
  const text = optionalText(value);
  if (!text) return "";
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(text)) return text;
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [hours, minutes] = text.split(":");
    return `${hours.padStart(2, "0")}:${minutes}:00`;
  }
  return text;
}

function asWorkShiftList(payload: unknown): WorkShiftRecord[] {
  if (Array.isArray(payload)) return payload as WorkShiftRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as WorkShiftRecord[];
  return [];
}

function asWorkShift(payload: unknown): WorkShiftRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as WorkShiftRecord;
}

export function workShiftToRow(record: WorkShiftRecord, orgName = ""): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const shiftId = readValue(source, ["Shift_id", "Shift_Id", "shift_id", "id"]);

  return {
    id: String(shiftId ?? ""),
    Shift_id: Number(shiftId ?? 0),
    Org_Id: Number(readValue(source, ["Org_Id", "org_id"]) ?? 0),
    Org_Name: orgName || optionalText(readValue(source, ["Org_Name", "org_name"])) || "",
    Shift_code: String(readValue(source, ["Shift_code", "shift_code"]) ?? ""),
    Shift_name: String(readValue(source, ["Shift_name", "shift_name"]) ?? ""),
    Start_time: formatTimeForDisplay(readValue(source, ["Start_time", "start_time"])),
    End_time: formatTimeForDisplay(readValue(source, ["End_time", "end_time"])),
    Overtime_hr: toDecimalNumber(readValue(source, ["Overtime_hr", "overtime_hr"])),
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
  };
}

export function rowToWorkShiftPayload(row: HrmsRow): WorkShiftWritePayload {
  const overtime = row.Overtime_hr;
  const overtimeHr =
    overtime === undefined || overtime === null || overtime === ""
      ? undefined
      : toDecimalNumber(overtime);

  return {
    org_id: Number(row.Org_Id ?? 0),
    shift_code: String(row.Shift_code ?? "").trim(),
    shift_name: String(row.Shift_name ?? "").trim(),
    start_time: formatTimeForApi(row.Start_time),
    end_time: formatTimeForApi(row.End_time),
    overtime_hr: overtimeHr,
    status: toOrganizationStatus(row.Status),
  };
}

function withListQuery(basePath: string, query?: WorkShiftListQuery) {
  const params = new URLSearchParams();
  if (query?.org_id !== undefined) params.set("org_id", String(query.org_id));
  if (query?.status !== undefined) params.set("status", String(query.status));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const workShiftService = {
  list: async (query?: WorkShiftListQuery, orgNameById?: Map<number, string>) => {
    const payload = await apiClient.get<unknown>(withListQuery(API_ENDPOINTS.workShift.list, query));
    return asWorkShiftList(payload).map((record) => {
      const orgId = Number((record as unknown as Record<string, unknown>).Org_Id ?? 0);
      const orgName = orgNameById?.get(orgId) ?? "";
      return workShiftToRow(record, orgName);
    });
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.workShift.get(id));
    return workShiftToRow(asWorkShift(payload));
  },

  getByCode: async (orgId: string | number, code: string) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.workShift.getByCode(orgId, code));
    return workShiftToRow(asWorkShift(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.workShift.create,
      rowToWorkShiftPayload(row),
    );
    return workShiftToRow(asWorkShift(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.workShift.update(id),
      rowToWorkShiftPayload(row),
    );
    return workShiftToRow(asWorkShift(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.workShift.delete(id),
      { unwrap: false },
    ),
};
