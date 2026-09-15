import { getCurrentOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  EarlyLeavingReportQuery,
  EarlyLeavingReportRecord,
} from "@/lib/api/types";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): EarlyLeavingReportRecord[] {
  if (Array.isArray(payload)) return payload as EarlyLeavingReportRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as EarlyLeavingReportRecord[];
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

function optionalNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function optionalId(value: unknown): number | "" {
  if (value === undefined || value === null || value === "") return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : "";
}

function formatPunchTime(value: unknown): string {
  const raw = optionalText(value);
  if (!raw) return "";
  const timePart = raw.includes(" ")
    ? raw.split(" ")[1]
    : raw.includes("T")
      ? raw.split("T")[1]
      : raw;
  const cleaned = timePart.replace(/Z$/i, "").slice(0, 8);
  return formatTimeDisplay(cleaned) || cleaned;
}

export function earlyLeavingReportToRow(record: EarlyLeavingReportRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const attendanceId = readValue(source, ["Attendance_id", "attendance_id", "id"]);
  const employeeId = readValue(source, ["Employee_id", "employee_id"]);
  const employeeName = optionalText(
    readValue(source, ["Employee_name", "employee_name", "Display_name", "display_name"]),
  );
  const attendanceDateRaw = optionalText(
    readValue(source, ["Attendance_date", "attendance_date"]),
  );
  const statusName = optionalText(
    readValue(source, ["Attendance_status_name", "attendance_status_name"]),
  );
  const statusCode = optionalId(
    readValue(source, [
      "Attendance_status_code",
      "attendance_status_code",
      "Attendance_status",
      "attendance_status",
    ]),
  );

  return {
    id: String(attendanceId ?? `${employeeId}-${attendanceDateRaw}`),
    Attendance_id: Number(attendanceId ?? 0),
    Employee_id: Number(employeeId ?? 0),
    Employee_code: optionalText(readValue(source, ["Employee_code", "employee_code"])),
    Employee_name: employeeName,
    Display_name: employeeName,
    Branch_Id: optionalId(readValue(source, ["Branch_Id", "branch_id"])),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Dept_Id: optionalId(readValue(source, ["Dept_Id", "dept_id"])),
    Dept_Name: optionalText(readValue(source, ["Dept_Name", "dept_name"])),
    Desig_Id: optionalId(readValue(source, ["Desig_Id", "desig_id"])),
    Desig_Name: optionalText(readValue(source, ["Desig_Name", "desig_name"])),
    Attendance_date: attendanceDateRaw
      ? formatDateDisplay(attendanceDateRaw) || attendanceDateRaw
      : "",
    Attendance_date_raw: attendanceDateRaw,
    Shift_id: optionalId(readValue(source, ["Shift_id", "shift_id"])),
    Shift_code: optionalText(readValue(source, ["Shift_code", "shift_code"])),
    Shift_name: optionalText(readValue(source, ["Shift_name", "shift_name"])),
    Shift_end: formatPunchTime(readValue(source, ["Shift_end", "shift_end"])),
    Check_in: formatPunchTime(readValue(source, ["Check_in", "check_in"])),
    Check_out: formatPunchTime(readValue(source, ["Check_out", "check_out"])),
    Early_leave_minutes: optionalNumber(
      readValue(source, ["Early_leave_minutes", "early_leave_minutes"]),
    ),
    Working_minutes: optionalNumber(
      readValue(source, ["Working_minutes", "working_minutes"]),
    ),
    Attendance_status: statusCode,
    Attendance_status_code: statusCode,
    Attendance_status_name: statusName || String(statusCode || ""),
    Status: statusName || String(statusCode || ""),
    Source: optionalId(readValue(source, ["Source", "source"])),
    Source_name: optionalText(readValue(source, ["Source_name", "source_name"])),
    Remarks: optionalText(readValue(source, ["Remarks", "remarks"])),
  };
}

function withQuery(basePath: string, query?: EarlyLeavingReportQuery) {
  const params = new URLSearchParams();
  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined && orgId !== null && String(orgId) !== "") {
    params.set("org_id", String(orgId));
  }
  if (query?.from_date?.trim()) params.set("from_date", query.from_date.trim());
  if (query?.to_date?.trim()) params.set("to_date", query.to_date.trim());
  if (query?.branch_id !== undefined && String(query.branch_id) !== "") {
    params.set("branch_id", String(query.branch_id));
  }
  if (query?.dept_id !== undefined && String(query.dept_id) !== "") {
    params.set("dept_id", String(query.dept_id));
  }
  if (query?.employee_id !== undefined && String(query.employee_id) !== "") {
    params.set("employee_id", String(query.employee_id));
  }
  if (query?.min_early_minutes !== undefined && String(query.min_early_minutes) !== "") {
    params.set("min_early_minutes", String(query.min_early_minutes));
  }
  if (query?.search?.trim()) params.set("search", query.search.trim());

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const earlyLeavingReportService = {
  list: async (query?: EarlyLeavingReportQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.earlyLeavingReport.list, query),
    );
    return asList(payload).map(earlyLeavingReportToRow);
  },
};
