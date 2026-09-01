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
  const code = String(values.Leave_code ?? "").trim().toUpperCase();
  const name = String(values.Leave_name ?? "").trim();

  return {
    ...values,
    id: String(values.id ?? `lm-${Date.now()}`),
    Leave_code: code,
    Leave_name: name,
    Leave_category: String(values.Leave_category ?? "Paid"),
    Annual_quota: Number(values.Annual_quota ?? 0),
    Carry_forward: String(values.Carry_forward ?? "No"),
    Encashable: String(values.Encashable ?? "No"),
    Requires_document: String(values.Requires_document ?? "No"),
    Status: String(values.Status ?? "Active"),
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

  return {
    ...base,
    id: String(values.id ?? `lappr-${Date.now()}`),
    Leave_type: String(values.Leave_type ?? "").trim(),
    From_date: String(values.From_date ?? ""),
    To_date: String(values.To_date ?? ""),
    Number_of_days: Number(values.Number_of_days ?? 0),
    Applied_on: String(values.Applied_on ?? ""),
    Approval_status: String(values.Approval_status ?? "Pending"),
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
