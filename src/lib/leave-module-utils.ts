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
  return Number(leaveMaster?.Leave_days ?? leaveMaster?.Leaves_per_year ?? 0);
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
  const leaveCode = String(values.Leave_code ?? values.Short_name ?? "")
    .trim()
    .toUpperCase();
  const name = String(values.Leave_name ?? "").trim();
  const documentRequired = String(values.Document_required ?? values.Requires_document ?? "No");
  const leaveDays = Number(values.Leave_days ?? values.Leaves_per_year ?? 0);
  const validityRaw = String(values.Validity ?? "1").trim();
  const validityCode =
    validityRaw === "2" || validityRaw.toLowerCase().includes("day")
      ? "2"
      : validityRaw === "3" || validityRaw.toLowerCase().includes("carry")
        ? "3"
        : validityRaw === "1" || validityRaw.toLowerCase().includes("year")
          ? "1"
          : validityRaw || "1";
  const validityLabel =
    validityCode === "2"
      ? "Within Days"
      : validityCode === "3"
        ? "Carry Forwarded"
        : "Within Year";
  const genderRaw = String(values.Applicable_gender ?? "A").trim().toUpperCase();
  const gender = genderRaw === "M" || genderRaw === "F" ? genderRaw : "A";
  const genderLabel = gender === "M" ? "Male" : gender === "F" ? "Female" : "All";
  const isActive = !(
    values.Status === "Inactive" ||
    values.Status === 0 ||
    values.Status === "0" ||
    values.Is_active === false ||
    values.Is_active === 0 ||
    values.Is_active === "0"
  );

  return {
    ...values,
    id: String(values.id ?? `lm-${Date.now()}`),
    Leave_name: name,
    Leave_code: leaveCode,
    Short_name: leaveCode,
    Leave_days: leaveDays,
    Leaves_per_year: leaveDays,
    Document_required: documentRequired === "Yes" || documentRequired === "1" ? "Yes" : "No",
    Requires_document: documentRequired === "Yes" || documentRequired === "1" ? "Yes" : "No",
    Is_paid: values.Is_paid === false || values.Is_paid === 0 || values.Is_paid === "0" ? 0 : 1,
    Is_half_day_allowed:
      values.Is_half_day_allowed === false ||
      values.Is_half_day_allowed === 0 ||
      values.Is_half_day_allowed === "0"
        ? 0
        : 1,
    Is_carry_forward:
      values.Is_carry_forward === true ||
      values.Is_carry_forward === 1 ||
      values.Is_carry_forward === "1" ||
      validityCode === "3"
        ? 1
        : 0,
    Max_carry_forward_days: Number(values.Max_carry_forward_days ?? 0),
    Is_encashable:
      values.Is_encashable === true || values.Is_encashable === 1 || values.Is_encashable === "1"
        ? 1
        : 0,
    Max_encash_days: Number(values.Max_encash_days ?? 0),
    Requires_approval:
      values.Requires_approval === false ||
      values.Requires_approval === 0 ||
      values.Requires_approval === "0"
        ? 0
        : 1,
    Minimum_days: Number(values.Minimum_days ?? 1),
    Maximum_days:
      values.Maximum_days === undefined || values.Maximum_days === null || values.Maximum_days === ""
        ? null
        : Number(values.Maximum_days),
    Applicable_gender: gender,
    Applicable_gender_label: genderLabel,
    Applicable_employee_type: String(values.Applicable_employee_type ?? "").trim(),
    Validity: validityCode,
    Validity_label: validityLabel,
    Days_number: Number(values.Days_number ?? 0),
    Is_active: Boolean(isActive),
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
  const leavesJson = typeof values.Leaves === "string" ? values.Leaves.trim() : "";
  if (leavesJson.startsWith("[")) {
    return {
      ...values,
      id: String(values.id ?? ""),
      Fin_year: String(values.Fin_year ?? values.Year_Id ?? "").trim(),
      Year_Id: Number(values.Year_Id ?? values.Fin_year ?? 0) || undefined,
      Leaves: leavesJson,
    };
  }

  const leaveType = String(values.Leave_type ?? values.Leave_name ?? "").trim();
  const matched =
    leaveTypes.find(
      (row) => String(row.Leave_Id ?? row.id ?? "").trim() === String(values.Leave_id ?? "").trim(),
    ) || leaveTypes.find((row) => String(row.Leave_name ?? "").trim() === leaveType);
  const allocation = Number(values.Allocated_days ?? values.Allocation ?? 0);

  return {
    ...values,
    id: String(values.id ?? values.Employee_Leave_Id ?? `lent-${Date.now()}`),
    Employee_Leave_Id: values.Employee_Leave_Id ?? values.id,
    Financial_year: String(values.Financial_year ?? "").trim(),
    Leave_id: String(values.Leave_id ?? matched?.Leave_Id ?? matched?.id ?? "").trim(),
    Leave_type: leaveType,
    Leave_code: String(matched?.Leave_code ?? values.Leave_code ?? ""),
    Allocated_days: allocation < 0 ? 0 : allocation,
    Allocation: allocation < 0 ? 0 : allocation,
    Status: String(values.Status ?? "Active"),
  };
}

export function enrichLeaveRequisitionRow(
  values: HrmsRow,
  employees: HrmsRow[],
  leaveTypes: HrmsRow[],
  existingRows: HrmsRow[] = [],
): HrmsRow {
  const employeeId = String(values.Employee_id ?? values.Employee_Id ?? "").trim();
  if (!employeeId) {
    throw new Error("Employee is required.");
  }

  const employeeCode = String(values.Employee_code ?? "").trim();
  const employee =
    employees.find((row) => String(row.Employee_id ?? row.id ?? "").trim() === employeeId) ||
    employees.find((row) => String(row.Employee_code ?? "").trim() === employeeCode);

  const leaveId = String(values.Leave_id ?? values.Leave_Id ?? "").trim();
  const leaveTypeName = String(values.Leave_type ?? values.Leave_name ?? "").trim();
  const matched =
    leaveTypes.find((row) => String(row.Leave_Id ?? row.id ?? "").trim() === leaveId) ||
    leaveTypes.find((row) => String(row.Leave_name ?? "").trim() === leaveTypeName);

  const fromDate = String(values.From_date ?? "");
  const toDate = String(values.To_date ?? "");
  const halfDay = String(values.Half_day ?? "").trim();
  const dayCount = countLeaveDays(fromDate, toDate);
  const numberOfDays =
    Number(values.Number_of_days) || (halfDay && dayCount === 1 ? 0.5 : dayCount);
  const documentRequired =
    String(values.Requires_document ?? matched?.Document_required ?? matched?.Requires_document ?? "No") ===
      "Yes" ||
    values.Requires_document === 1 ||
    values.Requires_document === "1";
  const documentFile = values.Supporting_document;
  const documentName =
    documentFile instanceof File
      ? documentFile.name
      : String(values.Document_name ?? values.Supporting_document_name ?? "").trim();

  if (documentRequired && !documentName) {
    throw new Error("Attachment is required for this leave type.");
  }

  const applicationNo = String(values.Application_no ?? "").trim();

  return {
    ...values,
    id: String(values.id ?? `lreq-${Date.now()}`),
    Application_no: applicationNo,
    Branch_Id: String(values.Branch_Id ?? employee?.Branch_Id ?? "").trim(),
    Branch_Name: String(values.Branch_Name ?? employee?.Branch_Name ?? "").trim(),
    Employee_id: employeeId || String(employee?.Employee_id ?? employee?.id ?? ""),
    Employee_code: String(employee?.Employee_code ?? employeeCode),
    Employee_name: String(
      employee?.Display_name ?? employee?.Employee_name ?? values.Employee_name ?? "",
    ),
    Leave_id: leaveId || String(matched?.Leave_Id ?? matched?.id ?? ""),
    Leave_type: leaveTypeName || String(matched?.Leave_name ?? ""),
    Leave_name: leaveTypeName || String(matched?.Leave_name ?? ""),
    Leave_code: String(matched?.Leave_code ?? values.Leave_code ?? ""),
    Balance_leave: Number(
      values.Balance_leave ?? matched?.Balance_leave ?? matched?.Leaves_per_year ?? 0,
    ),
    From_date: fromDate,
    To_date: toDate,
    Number_of_days: numberOfDays,
    Half_day: halfDay,
    Reason: String(values.Reason ?? "").trim(),
    Document_name: documentName || undefined,
    Requires_document: documentRequired ? "Yes" : "No",
    Application_status: String(values.Application_status ?? values.Status ?? "Pending"),
    Application_status_code: Number(values.Application_status_code ?? 1),
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
