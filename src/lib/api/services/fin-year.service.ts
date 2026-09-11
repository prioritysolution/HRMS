import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { FinYearListQuery, FinYearRecord } from "@/lib/api/types";
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
  const statusRaw = readValue(source, ["Status", "status"]);
  const isActive =
    statusRaw === undefined ||
    statusRaw === null ||
    statusRaw === "" ||
    statusRaw === 1 ||
    statusRaw === "1" ||
    String(statusRaw).toLowerCase() === "active";

  return {
    id: String(yearId),
    Year_Id: yearId,
    Year_Name: yearName,
    Financial_year: yearName,
    Start_Date: optionalText(readValue(source, ["Start_Date", "start_date"])),
    End_Date: optionalText(readValue(source, ["End_Date", "end_date"])),
    Status: isActive ? "Active" : "Inactive",
    Status_code: isActive ? 1 : 0,
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
};
