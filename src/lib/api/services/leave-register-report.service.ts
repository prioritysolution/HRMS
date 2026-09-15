import { getCurrentOrgId } from "@/lib/auth/org-context";
import { apiClient, isSoftApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  LeaveRegisterReportQuery,
  LeaveRegisterReportRecord,
} from "@/lib/api/types";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): LeaveRegisterReportRecord[] {
  if (Array.isArray(payload)) return payload as LeaveRegisterReportRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as LeaveRegisterReportRecord[];
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

export const LEAVE_REGISTER_STATUS_OPTIONS = [
  { value: "1", label: "Pending" },
  { value: "2", label: "Approved" },
  { value: "3", label: "Rejected" },
  { value: "4", label: "Cancelled" },
] as const;

export function leaveRegisterReportToRow(record: LeaveRegisterReportRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const applicationId = readValue(source, [
    "Leave_Application_Id",
    "leave_application_id",
    "id",
  ]);
  const employeeId = readValue(source, ["Employee_Id", "employee_id", "Employee_id"]);
  const employeeName = optionalText(
    readValue(source, ["Employee_name", "employee_name", "Display_name", "display_name"]),
  );
  const leaveName = optionalText(readValue(source, ["Leave_Name", "leave_name"]));
  const leaveCode = optionalText(readValue(source, ["Leave_Code", "leave_code"]));
  const statusName = optionalText(
    readValue(source, ["Leave_Status_name", "leave_status_name"]),
  );
  const statusCode = optionalId(
    readValue(source, [
      "Leave_Status_code",
      "leave_status_code",
      "Leave_Status",
      "leave_status",
    ]),
  );
  const fromDateRaw = optionalText(readValue(source, ["From_Date", "from_date"]));
  const toDateRaw = optionalText(readValue(source, ["To_Date", "to_date"]));
  const appliedDateRaw = optionalText(
    readValue(source, ["Applied_Date", "applied_date"]),
  );
  const statusDateRaw = optionalText(readValue(source, ["Status_Date", "status_date"]));
  const isPaid = optionalNumber(readValue(source, ["Is_Paid", "is_paid"]));
  const halfDayName = optionalText(
    readValue(source, ["Half_Day_name", "half_day_name"]),
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
    Photo_path: optionalText(readValue(source, ["Photo_path", "photo_path"])),
    Mobile: optionalText(readValue(source, ["Mobile", "mobile"])),
    Branch_Id: optionalId(readValue(source, ["Branch_Id", "branch_id"])),
    Branch_Code: optionalText(readValue(source, ["Branch_Code", "branch_code"])),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Dept_Id: optionalId(readValue(source, ["Dept_Id", "dept_id"])),
    Dept_Name: optionalText(readValue(source, ["Dept_Name", "dept_name"])),
    Desig_Id: optionalId(readValue(source, ["Desig_Id", "desig_id"])),
    Desig_Name: optionalText(readValue(source, ["Desig_Name", "desig_name"])),
    Leave_Id: optionalId(readValue(source, ["Leave_Id", "leave_id"])),
    Leave_Code: leaveCode,
    Leave_Name: leaveName,
    Leave_type: leaveCode ? `${leaveName} (${leaveCode})` : leaveName,
    Is_Paid: isPaid,
    Is_Paid_label: isPaid === 1 ? "Paid" : "Unpaid",
    From_Date: formatDate(fromDateRaw),
    From_Date_raw: fromDateRaw,
    To_Date: formatDate(toDateRaw),
    To_Date_raw: toDateRaw,
    Total_Days: optionalText(readValue(source, ["Total_Days", "total_days"])) || "0",
    Half_Day: optionalId(readValue(source, ["Half_Day", "half_day"])),
    Half_Day_code: optionalText(readValue(source, ["Half_Day_code", "half_day_code"])),
    Half_Day_name: halfDayName,
    Half_day_label: halfDayName || "—",
    Reason: optionalText(readValue(source, ["Reason", "reason"])),
    Document_File: optionalText(readValue(source, ["Document_File", "document_file"])),
    Leave_Status: statusCode,
    Leave_Status_code: statusCode,
    Leave_Status_name: statusName || String(statusCode || ""),
    Status: statusName || String(statusCode || ""),
    Applied_Date: formatDateTime(appliedDateRaw),
    Applied_Date_raw: appliedDateRaw,
    Status_by: optionalId(readValue(source, ["Status_by", "status_by"])),
    Status_by_name: optionalText(readValue(source, ["Status_by_name", "status_by_name"])),
    Status_Date: formatDateTime(statusDateRaw),
    Status_Date_raw: statusDateRaw,
    Remarks: optionalText(readValue(source, ["Remarks", "remarks"])),
    Employee_status: optionalId(
      readValue(source, ["Employee_status", "employee_status"]),
    ),
  };
}

function withQuery(basePath: string, query?: LeaveRegisterReportQuery) {
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
  if (query?.leave_id !== undefined && String(query.leave_id) !== "") {
    params.set("leave_id", String(query.leave_id));
  }

  const leaveStatus = query?.leave_status ?? query?.application_status;
  if (leaveStatus !== undefined && String(leaveStatus) !== "") {
    params.set("leave_status", String(leaveStatus));
  }

  if (query?.search?.trim()) params.set("search", query.search.trim());

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const leaveRegisterReportService = {
  list: async (query?: LeaveRegisterReportQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.leaveRegisterReport.list, query),
      { throwOnError: false },
    );
    if (isSoftApiError(payload)) return [];
    return asList(payload).map(leaveRegisterReportToRow);
  },
};
