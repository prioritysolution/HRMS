import type { FormField, HrmsRow } from "@/types/hrms";
import { getHrmsMockRows } from "@/data/hrms-mock";
import { parseDateToIso, isoToDate } from "@/lib/date-utils";
import {
  enrichEmployeeAttendanceRow,
  withEmployeeSelectOptions,
} from "@/lib/attendance-module-utils";

export function countLeaveDays(fromDate: string, toDate: string): number {
  const fromIso = parseDateToIso(fromDate);
  const toIso = parseDateToIso(toDate);
  const from = isoToDate(fromIso);
  const to = isoToDate(toIso);
  if (!from || !to) return 0;

  const start = from.getTime() <= to.getTime() ? from : to;
  const end = from.getTime() <= to.getTime() ? to : from;
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function getActiveLeaveTypes(): HrmsRow[] {
  return getHrmsMockRows("leave-master").filter((row) => {
    const status = String(row.Status ?? "Active").toLowerCase();
    return status === "active" || status === "1";
  });
}

export function selectOptionsFromLeaveTypes(
  leaveTypes: HrmsRow[],
): Array<{ value: string; label: string }> {
  return leaveTypes
    .map((row) => {
      const code = String(row.Leave_code ?? row.Leave_Code ?? "").trim();
      const name = String(row.Leave_name ?? row.Leave_Name ?? code).trim();
      if (!name) return null;
      return { value: name, label: code ? `${name} (${code})` : name };
    })
    .filter((option): option is { value: string; label: string } => option !== null);
}

export function withBranchSelectOptions(fields: FormField[]): FormField[] {
  const options = getHrmsMockRows("branches")
    .map((row) => String(row.Branch_Name ?? "").trim())
    .filter(Boolean)
    .map((branch) => ({ value: branch, label: branch }));

  if (options.length === 0) return fields;

  return fields.map((field) => (field.name === "Branch_Name" ? { ...field, options } : field));
}

export function nextLeaveRequisitionNo(rows: HrmsRow[]): string {
  const highest = rows.reduce((max, row) => {
    const match = String(row.Application_no ?? "").match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `LR-${new Date().getFullYear()}-${String(highest + 1).padStart(3, "0")}`;
}

export function lookupLeaveBalance(employeeCode: string, leaveType: string): number {
  const allocation = getHrmsMockRows("leave-allocation").find(
    (row) =>
      String(row.Employee_code ?? "").trim() === employeeCode &&
      String(row.Leave_type ?? "").trim() === leaveType,
  );
  if (allocation) return Number(allocation.Balance_days ?? 0);

  const leaveMaster = getActiveLeaveTypes().find(
    (row) => String(row.Leave_name ?? "").trim() === leaveType,
  );
  return Number(leaveMaster?.Leaves_per_year ?? 0);
}

export function withLeaveTypeOptions(fields: FormField[], leaveTypes: HrmsRow[]): FormField[] {
  const options = selectOptionsFromLeaveTypes(leaveTypes);
  if (options.length === 0) return fields;

  return fields.map((field) => {
    if (field.name === "Leave_type" || field.name === "Leave_name") {
      return { ...field, options };
    }
    return field;
  });
}

export function withEmployeeAndLeaveTypeOptions(
  fields: FormField[],
  employees: HrmsRow[],
  leaveTypes: HrmsRow[],
): FormField[] {
  return withLeaveTypeOptions(withEmployeeSelectOptions(fields, employees), leaveTypes);
}

export function enrichLeaveMasterRow(values: HrmsRow): HrmsRow {
  const shortName = String(values.Short_name ?? values.Leave_code ?? "").trim().toUpperCase();
  const name = String(values.Leave_name ?? "").trim();
  const documentRequired = String(values.Document_required ?? values.Requires_document ?? "No");
  const isActive =
    values.Is_active === true ||
    values.Is_active === "true" ||
    values.Is_active === 1 ||
    values.Is_active === "1";

  return {
    ...values,
    id: String(values.id ?? `lm-${Date.now()}`),
    Leave_name: name,
    Short_name: shortName,
    Leave_code: shortName,
    Document_required: documentRequired,
    Requires_document: documentRequired,
    Leaves_per_year: Number(values.Leaves_per_year ?? 0),
    Validity: String(values.Validity ?? "Within Year"),
    Days_number: Number(values.Days_number ?? 0),
    Is_active: isActive,
    Status: isActive ? "Active" : "Inactive",
  };
}

export function enrichLeavePolicyRow(values: HrmsRow, leaveTypes: HrmsRow[]): HrmsRow {
  const leaveType = String(values.Leave_type ?? "").trim();
  const matched = leaveTypes.find(
    (row) => String(row.Leave_name ?? "").trim() === leaveType,
  );

  return {
    ...values,
    id: String(values.id ?? `lp-${Date.now()}`),
    Policy_name: String(values.Policy_name ?? "").trim(),
    Leave_type: leaveType,
    Leave_code: String(matched?.Leave_code ?? values.Leave_code ?? ""),
    Applicable_to: String(values.Applicable_to ?? "All Employees"),
    Min_days_notice: Number(values.Min_days_notice ?? 0),
    Max_consecutive_days: Number(values.Max_consecutive_days ?? 0),
    Sandwich_rule: String(values.Sandwich_rule ?? "No"),
    Half_day_allowed: String(values.Half_day_allowed ?? "Yes"),
    Status: String(values.Status ?? "Active"),
  };
}

export function enrichLeaveAllocationRow(
  values: HrmsRow,
  employees: HrmsRow[],
  leaveTypes: HrmsRow[],
): HrmsRow {
  const base = enrichEmployeeAttendanceRow(values, employees);
  const allocated = Number(values.Allocated_days ?? 0);
  const used = Number(values.Used_days ?? 0);
  const leaveType = String(values.Leave_type ?? "").trim();
  const matched = leaveTypes.find((row) => String(row.Leave_name ?? "").trim() === leaveType);

  return {
    ...base,
    id: String(values.id ?? `la-${Date.now()}`),
    Leave_type: leaveType,
    Leave_code: String(matched?.Leave_code ?? values.Leave_code ?? ""),
    Year: String(values.Year ?? new Date().getFullYear()),
    Allocated_days: allocated,
    Used_days: used,
    Balance_days: Math.max(allocated - used, 0),
    Status: String(values.Status ?? "Active"),
  };
}

export function currentFinancialYear(date = new Date()): string {
  const year = date.getFullYear();
  const start = date.getMonth() >= 3 ? year : year - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

export function sortFinancialYears(years: string[]): string[] {
  return [...new Set(years.map((year) => year.trim()).filter(Boolean))].sort((left, right) =>
    right.localeCompare(left, undefined, { numeric: true }),
  );
}

export function latestFinancialYear(years: string[], fallback = currentFinancialYear()): string {
  return sortFinancialYears(years)[0] ?? fallback;
}

export function enrichLeaveEntitlementRow(values: HrmsRow, leaveTypes: HrmsRow[]): HrmsRow {
  const leaveType = String(values.Leave_type ?? "").trim();
  const matched = leaveTypes.find((row) => String(row.Leave_name ?? "").trim() === leaveType);
  const allocation = Number(values.Allocation ?? 0);

  return {
    ...values,
    id: String(values.id ?? `lent-${Date.now()}`),
    Financial_year: String(values.Financial_year ?? "").trim(),
    Leave_type: leaveType,
    Leave_code: String(matched?.Leave_code ?? values.Leave_code ?? ""),
    Allocation: allocation < 0 ? 0 : allocation,
  };
}

export function enrichLeaveRequisitionRow(
  values: HrmsRow,
  employees: HrmsRow[],
  leaveTypes: HrmsRow[],
  existingRows: HrmsRow[] = [],
): HrmsRow {
  const base = enrichEmployeeAttendanceRow(values, employees);
  const employeeCode = String(base.Employee_code ?? "").trim();
  const employee = employees.find((row) => String(row.Employee_code ?? "").trim() === employeeCode);
  const leaveType = String(values.Leave_type ?? "").trim();
  const matched = leaveTypes.find((row) => String(row.Leave_name ?? "").trim() === leaveType);
  const fromDate = String(values.From_date ?? "");
  const toDate = String(values.To_date ?? "");
  const halfDay = String(values.Half_day ?? "").trim();
  const dayCount = countLeaveDays(fromDate, toDate);
  const numberOfDays = halfDay && dayCount === 1 ? 0.5 : dayCount;
  const documentRequired = String(matched?.Document_required ?? matched?.Requires_document ?? "No") === "Yes";
  const documentFile = values.Supporting_document;
  const documentName =
    documentFile instanceof File
      ? documentFile.name
      : String(values.Document_name ?? values.Supporting_document_name ?? "").trim();

  if (documentRequired && !documentName) {
    throw new Error("Attachment is required for this leave type.");
  }

  const applicationNo =
    String(values.Application_no ?? "").trim() || nextLeaveRequisitionNo(existingRows);

  return {
    ...base,
    id: String(values.id ?? `lreq-${Date.now()}`),
    Application_no: applicationNo,
    Branch_Name: String(values.Branch_Name ?? employee?.Branch_Name ?? "").trim(),
    Leave_type: leaveType,
    Leave_code: String(matched?.Leave_code ?? values.Leave_code ?? ""),
    Balance_leave: lookupLeaveBalance(employeeCode, leaveType),
    From_date: fromDate,
    To_date: toDate,
    Number_of_days: numberOfDays,
    Half_day: halfDay,
    Reason: String(values.Reason ?? "").trim(),
    Document_name: documentName || undefined,
    Requires_document: documentRequired ? "Yes" : "No",
  };
}

export function enrichLeaveApplicationRow(
  values: HrmsRow,
  employees: HrmsRow[],
  leaveTypes: HrmsRow[],
): HrmsRow {
  const base = enrichEmployeeAttendanceRow(values, employees);
  const fromDate = String(values.From_date ?? values.From_Date ?? "");
  const toDate = String(values.To_date ?? values.To_Date ?? "");
  const leaveType = String(values.Leave_type ?? "").trim();
  const matched = leaveTypes.find((row) => String(row.Leave_name ?? "").trim() === leaveType);
  const calculatedDays = countLeaveDays(fromDate, toDate);
  const numberOfDays = Number(values.Number_of_days ?? calculatedDays) || calculatedDays;

  const documentFile = values.Supporting_document;
  const documentName =
    documentFile instanceof File
      ? documentFile.name
      : String(values.Document_name ?? values.Supporting_document_name ?? "").trim();

  return {
    ...base,
    id: String(values.id ?? `lapp-${Date.now()}`),
    Leave_type: leaveType,
    Leave_code: String(matched?.Leave_code ?? values.Leave_code ?? ""),
    From_date: fromDate,
    To_date: toDate,
    Number_of_days: numberOfDays,
    Reason: String(values.Reason ?? "").trim(),
    Document_name: documentName || undefined,
    Application_status: String(values.Application_status ?? "Pending"),
    Applied_on: String(values.Applied_on ?? new Date().toISOString().slice(0, 10)),
    Requires_document: String(matched?.Requires_document ?? "No"),
  };
}

export function enrichLeaveApprovalRow(values: HrmsRow, employees: HrmsRow[]): HrmsRow {
  const base = enrichEmployeeAttendanceRow(values, employees);
  const status = String(values.Approval_status ?? "Pending").trim() || "Pending";

  return {
    ...base,
    id: String(values.id ?? `lappr-${Date.now()}`),
    Application_no: String(values.Application_no ?? "").trim(),
    Leave_type: String(values.Leave_type ?? "").trim(),
    From_date: String(values.From_date ?? ""),
    To_date: String(values.To_date ?? ""),
    Number_of_days: Number(values.Number_of_days ?? 0),
    Reason: String(values.Reason ?? "").trim(),
    Applied_on: String(values.Applied_on ?? ""),
    Approval_status: status,
    Approver_name: String(values.Approver_name ?? "Reporting Manager"),
    Remarks: String(values.Remarks ?? "").trim(),
  };
}

export function enrichLeaveCalendarRow(values: HrmsRow, employees: HrmsRow[]): HrmsRow {
  const base = enrichEmployeeAttendanceRow(values, employees);

  return {
    ...base,
    id: String(values.id ?? `lcal-${Date.now()}`),
    Leave_type: String(values.Leave_type ?? "").trim(),
    From_date: String(values.From_date ?? ""),
    To_date: String(values.To_date ?? ""),
    Number_of_days: Number(values.Number_of_days ?? 0),
    Calendar_month: String(values.Calendar_month ?? ""),
    Leave_status: String(values.Leave_status ?? "Approved"),
  };
}

export function enrichLeaveEncashmentRow(
  values: HrmsRow,
  employees: HrmsRow[],
  leaveTypes: HrmsRow[],
): HrmsRow {
  const base = enrichEmployeeAttendanceRow(values, employees);
  const leaveType = String(values.Leave_type ?? "").trim();
  const matched = leaveTypes.find((row) => String(row.Leave_name ?? "").trim() === leaveType);
  const days = Number(values.Days_to_encash ?? 0);
  const rate = Number(values.Per_day_rate ?? 0);

  return {
    ...base,
    id: String(values.id ?? `lenc-${Date.now()}`),
    Leave_type: leaveType,
    Leave_code: String(matched?.Leave_code ?? values.Leave_code ?? ""),
    Encashment_year: String(values.Encashment_year ?? new Date().getFullYear()),
    Days_to_encash: days,
    Per_day_rate: rate,
    Encashment_amount: Number(values.Encashment_amount ?? days * rate),
    Request_status: String(values.Request_status ?? "Pending"),
  };
}

export function countByLeaveStatus(rows: HrmsRow[], status: string): number {
  return rows.filter((row) => {
    const value = String(
      row.Application_status ?? row.Approval_status ?? row.Request_status ?? row.Leave_status ?? "",
    );
    return value.toLowerCase() === status.toLowerCase();
  }).length;
}
