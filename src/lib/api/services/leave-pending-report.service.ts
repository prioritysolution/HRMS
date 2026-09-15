import { getCurrentOrgId } from "@/lib/auth/org-context";
import { apiClient, isSoftApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  LeavePendingReportQuery,
  LeavePendingReportRecord,
} from "@/lib/api/types";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): LeavePendingReportRecord[] {
  if (Array.isArray(payload)) return payload as LeavePendingReportRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as LeavePendingReportRecord[];
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

function formatDate(value: unknown): string {
  const raw = optionalText(value);
  if (!raw) return "";
  return formatDateDisplay(raw) || raw.slice(0, 10);
}

function formatDateTime(value: unknown): string {
  const raw = optionalText(value);
  if (!raw) return "";
  const [datePart, timePart] = raw.includes("T") ? raw.split("T") : raw.split(" ");
  const dateLabel = formatDateDisplay(datePart) || datePart;
  if (!timePart) return dateLabel;
  const timeLabel = formatTimeDisplay(timePart.replace(/Z$/i, "").slice(0, 8));
  return timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
}

export function leavePendingReportToRow(record: LeavePendingReportRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const applicationId = readValue(source, [
    "Leave_Application_Id",
    "leave_application_id",
    "id",
  ]);
  const employeeId = readValue(source, ["Employee_Id", "employee_id"]);
  const employeeName = optionalText(
    readValue(source, ["Employee_name", "employee_name", "Display_name", "display_name"]),
  );
  const leaveName = optionalText(readValue(source, ["Leave_Name", "leave_name"]));
  const leaveCode = optionalText(readValue(source, ["Leave_Code", "leave_code"]));
  const statusName =
    optionalText(readValue(source, ["Leave_Status_name", "leave_status_name"])) ||
    "Pending";
  const statusCode = optionalId(
    readValue(source, ["Leave_Status", "leave_status", "Leave_Status_code"]),
  );
  const fromDateRaw = optionalText(readValue(source, ["From_Date", "from_date"]));
  const toDateRaw = optionalText(readValue(source, ["To_Date", "to_date"]));
  const appliedDateRaw = optionalText(
    readValue(source, ["Applied_Date", "applied_date"]),
  );
  const pendingDays = optionalNumber(
    readValue(source, ["Pending_Days", "pending_days"]),
  );

  return {
    id: String(applicationId ?? `${employeeId}-${fromDateRaw}-${leaveCode}`),
    Leave_Application_Id: Number(applicationId ?? 0),
    Application_No: optionalText(readValue(source, ["Application_No", "application_no"])),
    Employee_Id: Number(employeeId ?? 0),
    Employee_id: Number(employeeId ?? 0),
    Employee_code: optionalText(readValue(source, ["Employee_code", "employee_code"])),
    Employee_name: employeeName,
    Display_name: employeeName,
    Branch_Id: optionalId(readValue(source, ["Branch_Id", "branch_id"])),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Dept_Name: optionalText(readValue(source, ["Dept_Name", "dept_name"])),
    Desig_Name: optionalText(readValue(source, ["Desig_Name", "desig_name"])),
    Leave_Code: leaveCode,
    Leave_Name: leaveName,
    Leave_type: leaveCode ? `${leaveName} (${leaveCode})` : leaveName,
    From_Date: formatDate(fromDateRaw),
    From_Date_raw: fromDateRaw,
    To_Date: formatDate(toDateRaw),
    To_Date_raw: toDateRaw,
    Total_Days: optionalText(readValue(source, ["Total_Days", "total_days"])) || "0",
    Leave_Status: statusCode || 1,
    Leave_Status_name: statusName,
    Status: statusName,
    Applied_Date: formatDateTime(appliedDateRaw),
    Applied_Date_raw: appliedDateRaw,
    Pending_Days: pendingDays,
    Reason: optionalText(readValue(source, ["Reason", "reason"])),
  };
}

function withQuery(basePath: string, query?: LeavePendingReportQuery) {
  const params = new URLSearchParams();
  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined && orgId !== null && String(orgId) !== "") {
    params.set("org_id", String(orgId));
  }
  if (query?.branch_id !== undefined && String(query.branch_id) !== "") {
    params.set("branch_id", String(query.branch_id));
  }
  if (query?.dept_id !== undefined && String(query.dept_id) !== "") {
    params.set("dept_id", String(query.dept_id));
  }
  if (query?.employee_id !== undefined && String(query.employee_id) !== "") {
    params.set("employee_id", String(query.employee_id));
  }
  if (query?.leave_id !== undefined && String(query.leave_id) !== "") {
    params.set("leave_id", String(query.leave_id));
  }
  if (
    query?.min_pending_days !== undefined &&
    String(query.min_pending_days) !== ""
  ) {
    params.set("min_pending_days", String(query.min_pending_days));
  }
  if (query?.search?.trim()) params.set("search", query.search.trim());

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const leavePendingReportService = {
  list: async (query?: LeavePendingReportQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.leavePendingReport.list, query),
      { throwOnError: false },
    );
    if (isSoftApiError(payload)) return [];
    return asList(payload).map(leavePendingReportToRow);
  },
};
