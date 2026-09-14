import { getCurrentOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  EmployeeServiceHistoryReportQuery,
  EmployeeServiceHistoryReportRecord,
} from "@/lib/api/types";
import { formatDateDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): EmployeeServiceHistoryReportRecord[] {
  if (Array.isArray(payload)) return payload as EmployeeServiceHistoryReportRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) {
    return record.data as EmployeeServiceHistoryReportRecord[];
  }
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

function optionalNumber(value: unknown): number | "" {
  if (value === undefined || value === null || value === "") return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : "";
}

function statusLabel(value: unknown, name?: unknown): string {
  const named = optionalText(name);
  if (named) return named;
  if (value === 0 || value === "0") return "Inactive";
  if (value === 1 || value === "1") return "Active";
  return optionalText(value) || "—";
}

function formatChangeValue(description: unknown, amount: unknown): string {
  const label = optionalText(description);
  const amountText = optionalText(amount);
  if (label && amountText) return `${label} (${amountText})`;
  return label || amountText || "";
}

export function employeeServiceHistoryReportToRow(
  record: EmployeeServiceHistoryReportRecord,
): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const historyId = readValue(source, ["History_id", "history_id", "id"]);
  const employeeId = readValue(source, ["Employee_id", "employee_id"]);
  const eventType = readValue(source, [
    "Event_type_code",
    "event_type_code",
    "Event_type",
    "event_type",
  ]);
  const eventTypeName = optionalText(
    readValue(source, ["Event_type_name", "event_type_name"]),
  );
  const effectiveRaw = optionalText(
    readValue(source, ["Effective_date", "effective_date"]),
  );
  const employeeName = optionalText(
    readValue(source, ["Employee_name", "employee_name", "Display_name", "display_name"]),
  );

  return {
    id: String(historyId ?? ""),
    History_id: Number(historyId ?? 0),
    Employee_id: Number(employeeId ?? 0),
    Employee_code: optionalText(readValue(source, ["Employee_code", "employee_code"])),
    Employee_name: employeeName,
    Display_name: employeeName,
    Branch_Id: optionalNumber(readValue(source, ["Branch_Id", "branch_id"])),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Dept_Id: optionalNumber(readValue(source, ["Dept_Id", "dept_id"])),
    Dept_Name: optionalText(readValue(source, ["Dept_Name", "dept_name"])),
    Desig_Id: optionalNumber(readValue(source, ["Desig_Id", "desig_id"])),
    Desig_Name: optionalText(readValue(source, ["Desig_Name", "desig_name"])),
    Emp_type_name: optionalText(readValue(source, ["Emp_type_name", "emp_type_name"])),
    Employment_status_name: optionalText(
      readValue(source, ["Employment_status_name", "employment_status_name"]),
    ),
    Employee_status: optionalNumber(
      readValue(source, ["Employee_status", "employee_status", "Status", "status"]),
    ),
    Employee_status_name: statusLabel(
      readValue(source, ["Employee_status", "employee_status", "Status", "status"]),
      readValue(source, [
        "Employee_status_name",
        "employee_status_name",
        "Status_name",
        "status_name",
      ]),
    ),
    Status: statusLabel(
      readValue(source, ["Employee_status", "employee_status", "Status", "status"]),
      readValue(source, [
        "Employee_status_name",
        "employee_status_name",
        "Status_name",
        "status_name",
      ]),
    ),
    Event_type: eventTypeName || String(eventType ?? ""),
    Event_type_code: optionalNumber(eventType),
    Event_type_name: eventTypeName,
    Effective_date: effectiveRaw ? formatDateDisplay(effectiveRaw) || effectiveRaw : "",
    Effective_date_raw: effectiveRaw,
    Old_Id: optionalNumber(readValue(source, ["Old_Id", "old_id"])),
    Old_Opt_Description: optionalText(
      readValue(source, ["Old_Opt_Description", "old_opt_description"]),
    ),
    New_Id: optionalNumber(readValue(source, ["New_Id", "new_id"])),
    New_Opt_Description: optionalText(
      readValue(source, ["New_Opt_Description", "new_opt_description"]),
    ),
    Old_Amount: optionalText(readValue(source, ["Old_Amount", "old_amount"])),
    New_Amount: optionalText(readValue(source, ["New_Amount", "new_amount"])),
    Old_value: formatChangeValue(
      readValue(source, ["Old_Opt_Description", "old_opt_description"]),
      readValue(source, ["Old_Amount", "old_amount"]),
    ),
    New_value: formatChangeValue(
      readValue(source, ["New_Opt_Description", "new_opt_description"]),
      readValue(source, ["New_Amount", "new_amount"]),
    ),
    Remarks: optionalText(readValue(source, ["Remarks", "remarks"])),
    Created_by: optionalNumber(readValue(source, ["Created_by", "created_by"])),
    Created_at: optionalText(readValue(source, ["Created_at", "created_at"])),
  };
}

function withQuery(basePath: string, query?: EmployeeServiceHistoryReportQuery) {
  const params = new URLSearchParams();
  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined && orgId !== null && String(orgId) !== "") {
    params.set("org_id", String(orgId));
  }
  if (query?.event_type !== undefined && String(query.event_type) !== "") {
    params.set("event_type", String(query.event_type));
  }
  if (query?.status !== undefined && String(query.status) !== "") {
    params.set("status", String(query.status));
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

export const employeeServiceHistoryReportService = {
  list: async (query?: EmployeeServiceHistoryReportQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.employeeServiceHistoryReport.list, query),
    );
    return asList(payload).map(employeeServiceHistoryReportToRow);
  },
};
