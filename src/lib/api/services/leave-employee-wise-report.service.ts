import { getCurrentOrgId } from "@/lib/auth/org-context";
import { apiClient, isSoftApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  LeaveEmployeeWiseReportQuery,
  LeaveEmployeeWiseReportRecord,
} from "@/lib/api/types";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): LeaveEmployeeWiseReportRecord[] {
  if (Array.isArray(payload)) return payload as LeaveEmployeeWiseReportRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as LeaveEmployeeWiseReportRecord[];
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

function daysText(value: unknown): string {
  if (value === undefined || value === null || value === "") return "0.00";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return optionalText(value) || "0.00";
  return numeric.toFixed(2);
}

export function leaveEmployeeWiseReportToRow(
  record: LeaveEmployeeWiseReportRecord,
): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const employeeLeaveId = readValue(source, [
    "Employee_leave_id",
    "Employee_Leave_Id",
    "employee_leave_id",
    "id",
  ]);
  const employeeId = readValue(source, ["Employee_Id", "employee_id"]);
  const employeeName = optionalText(
    readValue(source, ["Employee_name", "employee_name", "Display_name", "display_name"]),
  );
  const leaveName = optionalText(readValue(source, ["Leave_Name", "leave_name"]));
  const leaveCode = optionalText(readValue(source, ["Leave_Code", "leave_code"]));
  const leaveId = optionalId(readValue(source, ["Leave_Id", "leave_id"]));
  const finYear = optionalId(readValue(source, ["Fin_Year", "fin_year"]));
  const finYearName = optionalText(
    readValue(source, ["Fin_Year_Name", "fin_year_name", "Year_Name", "year_name"]),
  );
  const allocated = daysText(readValue(source, ["Allocated_Days", "allocated_days"]));
  const used = daysText(readValue(source, ["Used_Days", "used_days"]));
  const balance = daysText(readValue(source, ["Balance_Days", "balance_days"]));

  return {
    id: String(
      employeeLeaveId ?? `${employeeId}-${leaveId}-${finYear}`,
    ),
    Employee_leave_id: Number(employeeLeaveId ?? 0),
    Employee_Leave_Id: Number(employeeLeaveId ?? 0),
    Employee_Id: Number(employeeId ?? 0),
    Employee_id: Number(employeeId ?? 0),
    Employee_code: optionalText(readValue(source, ["Employee_code", "employee_code"])),
    Employee_name: employeeName,
    Display_name: employeeName,
    Branch_Id: optionalId(readValue(source, ["Branch_Id", "branch_id"])),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Dept_Name: optionalText(readValue(source, ["Dept_Name", "dept_name"])),
    Desig_Name: optionalText(readValue(source, ["Desig_Name", "desig_name"])),
    Leave_Id: leaveId,
    Leave_Code: leaveCode,
    Leave_Name: leaveName,
    Leave_type: leaveCode ? `${leaveName} (${leaveCode})` : leaveName,
    Fin_Year: finYear,
    Fin_Year_Name: finYearName,
    Financial_year: finYearName || (finYear ? String(finYear) : ""),
    Opening_Balance: daysText(readValue(source, ["Opening_Balance", "opening_balance"])),
    Allocated_Days: allocated,
    Total_Allocated: allocated,
    Earned_Days: daysText(readValue(source, ["Earned_Days", "earned_days"])),
    Used_Days: used,
    Total_Used: used,
    Encashed_Days: daysText(readValue(source, ["Encashed_Days", "encashed_days"])),
    Carry_Forward_Days: daysText(
      readValue(source, ["Carry_Forward_Days", "carry_forward_days"]),
    ),
    Balance_Days: balance,
    Total_Balance: balance,
    Allocation_status: optionalNumber(
      readValue(source, ["Allocation_status", "allocation_status"]),
    ),
    Employee_status: optionalId(
      readValue(source, ["Employee_status", "employee_status"]),
    ),
  };
}

function withQuery(basePath: string, query?: LeaveEmployeeWiseReportQuery) {
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
  if (query?.fin_year !== undefined && String(query.fin_year) !== "") {
    params.set("fin_year", String(query.fin_year));
  }
  if (query?.search?.trim()) params.set("search", query.search.trim());

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const leaveEmployeeWiseReportService = {
  list: async (query?: LeaveEmployeeWiseReportQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.leaveEmployeeWiseReport.list, query),
      { throwOnError: false },
    );
    if (isSoftApiError(payload)) return [];
    return asList(payload).map(leaveEmployeeWiseReportToRow);
  },
};
