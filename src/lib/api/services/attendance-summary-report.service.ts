import { getCurrentOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  getEmployeePhotoMap,
  enrichRowsWithEmployeePhotos,
} from "@/lib/api/services/employee.service";
import type {
  AttendanceSummaryReportQuery,
  AttendanceSummaryReportRecord,
} from "@/lib/api/types";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): AttendanceSummaryReportRecord[] {
  if (Array.isArray(payload)) return payload as AttendanceSummaryReportRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as AttendanceSummaryReportRecord[];
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

function formatHours(value: unknown): string {
  const numeric = optionalNumber(value);
  if (!Number.isFinite(numeric)) return "0";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
}

export function attendanceSummaryReportToRow(
  record: AttendanceSummaryReportRecord,
): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const employeeId = readValue(source, ["Employee_id", "employee_id", "id"]);
  const employeeName = optionalText(
    readValue(source, ["Employee_name", "employee_name", "Display_name", "display_name"]),
  );

  return {
    id: String(employeeId ?? ""),
    Employee_id: Number(employeeId ?? 0),
    Employee_code: optionalText(readValue(source, ["Employee_code", "employee_code"])),
    Employee_name: employeeName,
    Display_name: employeeName,
    Photo_path:
      optionalText(
        readValue(source, [
          "Photo_path",
          "photo_path",
          "Photo",
          "photo",
          "avatar",
          "Avatar",
          "Emp_Photo",
          "emp_photo",
        ]),
      ) ?? "",
    Branch_Id: optionalId(readValue(source, ["Branch_Id", "branch_id"])),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Dept_Id: optionalId(readValue(source, ["Dept_Id", "dept_id"])),
    Dept_Name: optionalText(readValue(source, ["Dept_Name", "dept_name"])),
    Present_count: optionalNumber(readValue(source, ["Present_count", "present_count"])),
    Absent_count: optionalNumber(readValue(source, ["Absent_count", "absent_count"])),
    Half_day_count: optionalNumber(readValue(source, ["Half_day_count", "half_day_count"])),
    Late_status_count: optionalNumber(
      readValue(source, ["Late_status_count", "late_status_count"]),
    ),
    Leave_count: optionalNumber(readValue(source, ["Leave_count", "leave_count"])),
    Late_coming_days: optionalNumber(
      readValue(source, ["Late_coming_days", "late_coming_days"]),
    ),
    Early_leaving_days: optionalNumber(
      readValue(source, ["Early_leaving_days", "early_leaving_days"]),
    ),
    Total_late_minutes: optionalNumber(
      readValue(source, ["Total_late_minutes", "total_late_minutes"]),
    ),
    Total_early_leave_minutes: optionalNumber(
      readValue(source, ["Total_early_leave_minutes", "total_early_leave_minutes"]),
    ),
    Total_working_hours: formatHours(
      readValue(source, ["Total_working_hours", "total_working_hours"]),
    ),
    Total_overtime_hours: formatHours(
      readValue(source, ["Total_overtime_hours", "total_overtime_hours"]),
    ),
  };
}

function withQuery(basePath: string, query?: AttendanceSummaryReportQuery) {
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
  if (query?.search?.trim()) params.set("search", query.search.trim());

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const attendanceSummaryReportService = {
  list: async (query?: AttendanceSummaryReportQuery) => {
    const payload = await apiClient.get<unknown>(
       withQuery(API_ENDPOINTS.attendanceSummaryReport.list, query),
    );
    const rows = asList(payload).map(attendanceSummaryReportToRow);
    const photoMap = await getEmployeePhotoMap();
    return enrichRowsWithEmployeePhotos(rows, photoMap);
  },
};
