import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  FinYearListQuery,
  FinYearRecord,
  FinYearWritePayload,
} from "@/lib/api/types";
import {
  toOrganizationStatus,
  toOrganizationStatusLabel,
} from "@/lib/api/services/organization.service";
import { parseDateToIso } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): FinYearRecord[] {
  if (Array.isArray(payload)) return payload as FinYearRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as FinYearRecord[];
  return [];
}

function asOne(payload: unknown): FinYearRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as FinYearRecord;
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

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toIsoDate(value: unknown): string {
  const text = optionalText(value);
  if (!text) return "";
  return parseDateToIso(text) || text.slice(0, 10);
}

/** `2026-2027` → `FY2026-27` (display helper; not an API field). */
export function toFinancialYearCode(yearName: string): string {
  const trimmed = yearName.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{4})\s*[-–/]\s*(\d{2,4})$/);
  if (!match) return `FY${trimmed}`;
  const start = match[1];
  const endRaw = match[2];
  const end = endRaw.length === 4 ? endRaw.slice(2) : endRaw;
  return `FY${start}-${end}`;
}

function withListQuery(basePath: string, query?: FinYearListQuery) {
  const params = new URLSearchParams();
  if (query?.year_id !== undefined) params.set("year_id", String(query.year_id));
  if (query?.year_name) params.set("year_name", query.year_name);
  if (query?.status !== undefined && query.status !== null && String(query.status) !== "") {
    params.set("status", String(query.status));
  }
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function finYearToRow(record: FinYearRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const yearId = optionalNumber(readValue(source, ["Year_Id", "year_id", "id"])) ?? 0;
  const yearName = optionalText(readValue(source, ["Year_Name", "year_name"]));
  const isCurrent =
    toOrganizationStatusLabel(readValue(source, ["Status", "status"])) === "Active";

  return {
    id: String(yearId),
    Year_Id: yearId,
    Year_Name: yearName,
    Financial_year: yearName,
    Year_Code: toFinancialYearCode(yearName),
    Start_Date: toIsoDate(readValue(source, ["Start_Date", "start_date"])),
    End_Date: toIsoDate(readValue(source, ["End_Date", "end_date"])),
    Is_Current: isCurrent,
    // Keep numeric status so the "Current Financial Year" checkbox binds correctly on edit.
    Status: isCurrent ? 1 : 0,
  };
}

export function isFinYearMarkedCurrent(row: HrmsRow): boolean {
  return toOrganizationStatus(row.Status ?? (row.Is_Current ? 1 : 0)) === 1;
}

export function findCurrentFinYearConflict(
  rows: HrmsRow[],
  excludeId?: string | number,
): HrmsRow | null {
  const exclude = excludeId !== undefined && excludeId !== null ? String(excludeId) : "";
  return (
    rows.find((row) => {
      if (!isFinYearMarkedCurrent(row)) return false;
      const rowId = String(row.id ?? row.Year_Id ?? "");
      return exclude ? rowId !== exclude : true;
    }) ?? null
  );
}

export function currentFinYearConflictMessage(conflict: HrmsRow): string {
  const name = String(conflict.Year_Name ?? conflict.Financial_year ?? "another year");
  return `Only one financial year can be current. "${name}" is already set as current. Deactivate it first or uncheck Current Financial Year.`;
}

async function assertSingleCurrentFinYear(row: HrmsRow, excludeId?: string | number) {
  if (!isFinYearMarkedCurrent(row)) return;

  const existing = await finYearService.list({ status: 1 });
  const conflict = findCurrentFinYearConflict(existing, excludeId ?? row.id);
  if (conflict) {
    throw new Error(currentFinYearConflictMessage(conflict));
  }
}

export function rowToFinYearPayload(row: HrmsRow): FinYearWritePayload {
  const yearName = String(row.Year_Name ?? row.Financial_year ?? "").trim();
  const startDate = toIsoDate(row.Start_Date);
  const endDate = toIsoDate(row.End_Date);

  return {
    year_name: yearName,
    start_date: startDate,
    end_date: endDate,
    status: toOrganizationStatus(row.Status ?? (row.Is_Current ? 1 : 0)),
  };
}

export function finYearsToSelectOptions(rows: HrmsRow[]) {
  return [...rows]
    .sort((left, right) =>
      String(right.Year_Name ?? "").localeCompare(String(left.Year_Name ?? ""), undefined, {
        numeric: true,
      }),
    )
    .map((row) => {
      const id = String(row.Year_Id ?? row.id ?? "").trim();
      const name = String(row.Year_Name ?? row.Financial_year ?? "").trim();
      if (!name) return null;
      return {
        value: name,
        label: name,
        yearId: id,
      };
    })
    .filter((option): option is { value: string; label: string; yearId: string } => option !== null);
}

export const finYearService = {
  list: async (query?: FinYearListQuery) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.finYear.list, query),
    );
    return asList(payload).map(finYearToRow);
  },

  options: async (status: 0 | 1 = 1) => {
    const rows = await finYearService.list({ status });
    return finYearsToSelectOptions(rows);
  },

  create: async (row: HrmsRow) => {
    await assertSingleCurrentFinYear(row);
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.finYear.create,
      rowToFinYearPayload(row),
    );
    return finYearToRow(asOne(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    await assertSingleCurrentFinYear(row, id);
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.finYear.update(id),
      rowToFinYearPayload(row),
    );
    return finYearToRow(asOne(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.finYear.delete(id),
      { unwrap: false },
    ),
};
