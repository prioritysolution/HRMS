import { getCurrentOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  EmployeeRegisterReportQuery,
  EmployeeRegisterReportRecord,
} from "@/lib/api/types";
import { formatDateDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): EmployeeRegisterReportRecord[] {
  if (Array.isArray(payload)) return payload as EmployeeRegisterReportRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as EmployeeRegisterReportRecord[];
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

function statusLabel(value: unknown, name?: unknown): string {
  const named = optionalText(name);
  if (named) return named;
  if (value === 0 || value === "0") return "Inactive";
  if (value === 1 || value === "1") return "Active";
  return optionalText(value) || "—";
}

export function employeeRegisterReportToRow(
  record: EmployeeRegisterReportRecord,
): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const employeeId = readValue(source, ["Employee_id", "employee_id", "id"]);
  const joinRaw = optionalText(
    readValue(source, ["Date_of_joining", "date_of_joining"]),
  );

  return {
    id: String(employeeId ?? ""),
    Employee_id: Number(employeeId ?? 0),
    Employee_code: optionalText(readValue(source, ["Employee_code", "employee_code"])),
    Display_name: optionalText(readValue(source, ["Display_name", "display_name"])),
    Mobile: optionalText(readValue(source, ["Mobile", "mobile"])),
    Email: optionalText(readValue(source, ["Email", "email"])),
    Work_Email: optionalText(readValue(source, ["Work_Email", "work_email"])),
    Branch_Id: Number(readValue(source, ["Branch_Id", "branch_id"]) ?? 0) || "",
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Branch: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Dept_Id: Number(readValue(source, ["Dept_Id", "dept_id"]) ?? 0) || "",
    Dept_Name: optionalText(readValue(source, ["Dept_Name", "dept_name"])),
    Department: optionalText(readValue(source, ["Dept_Name", "dept_name"])),
    Desig_Id: Number(readValue(source, ["Desig_Id", "desig_id"]) ?? 0) || "",
    Desig_Name: optionalText(readValue(source, ["Desig_Name", "desig_name"])),
    Designation: optionalText(readValue(source, ["Desig_Name", "desig_name"])),
    Emp_type_id: Number(readValue(source, ["Emp_type_id", "emp_type_id"]) ?? 0) || "",
    Emp_type_name: optionalText(readValue(source, ["Emp_type_name", "emp_type_name"])),
    Category_name: optionalText(
      readValue(source, ["Category_name", "category_name", "Emp_type_name", "emp_type_name"]),
    ),
    Category: optionalText(
      readValue(source, ["Category_name", "category_name", "Emp_type_name", "emp_type_name"]),
    ),
    Employment_status: Number(
      readValue(source, ["Employment_status", "employment_status"]) ?? 0,
    ),
    Employment_status_name: optionalText(
      readValue(source, ["Employment_status_name", "employment_status_name"]),
    ),
    Date_of_joining: joinRaw ? formatDateDisplay(joinRaw) || joinRaw : "",
    Status: statusLabel(
      readValue(source, ["Status", "status"]),
      readValue(source, ["Status_name", "status_name"]),
    ),
    Status_name: optionalText(readValue(source, ["Status_name", "status_name"])),
    Bank_name: optionalText(readValue(source, ["Bank_name", "bank_name"])),
    Account_number: optionalText(readValue(source, ["Account_number", "account_number"])),
    Ifsc_code: optionalText(readValue(source, ["Ifsc_code", "ifsc_code"])),
    Pf_no: optionalText(readValue(source, ["Pf_no", "pf_no"])),
    Uan_no: optionalText(readValue(source, ["Uan_no", "uan_no"])),
    Esi_no: optionalText(readValue(source, ["Esi_no", "esi_no"])),
    IdCard_No: optionalText(readValue(source, ["IdCard_No", "idcard_no", "id_card_no"])),
    Identification_count: Number(
      readValue(source, ["Identification_count", "identification_count"]) ?? 0,
    ),
    Identifications: optionalText(
      readValue(source, ["Identifications", "identifications"]),
    ),
    Active_asset_count: Number(
      readValue(source, ["Active_asset_count", "active_asset_count"]) ?? 0,
    ),
    Active_asset_codes: optionalText(
      readValue(source, ["Active_asset_codes", "active_asset_codes"]),
    ),
  };
}

function withQuery(basePath: string, query?: EmployeeRegisterReportQuery) {
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
  if (query?.desig_id !== undefined && String(query.desig_id) !== "") {
    params.set("desig_id", String(query.desig_id));
  }
  if (query?.emp_type_id !== undefined && String(query.emp_type_id) !== "") {
    params.set("emp_type_id", String(query.emp_type_id));
  }
  if (query?.status !== undefined && String(query.status) !== "") {
    params.set("status", String(query.status));
  }
  if (query?.search?.trim()) {
    params.set("search", query.search.trim());
  }
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const employeeRegisterReportService = {
  list: async (query?: EmployeeRegisterReportQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.employeeRegisterReport.list, query),
    );
    return asList(payload).map(employeeRegisterReportToRow);
  },
};
