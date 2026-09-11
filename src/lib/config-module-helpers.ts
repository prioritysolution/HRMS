import type { FormField, HrmsRow } from "@/types/hrms";
import { getHrmsMockRows } from "@/data/hrms-mock";
import { withEmployeeSelectOptions } from "@/lib/attendance-module-utils";
import {
  enrichLeaveAllocationRow,
  enrichLeaveApplicationRow,
  enrichLeaveApprovalRow,
  enrichLeaveCalendarRow,
  enrichLeaveEncashmentRow,
  enrichLeaveEntitlementRow,
  enrichLeaveMasterRow,
  enrichLeavePolicyRow,
  enrichLeaveRequisitionRow,
  getActiveLeaveTypes,
  latestFinancialYear,
  withLeaveTypeOptions,
} from "@/lib/leave-module-utils";
import {
  enrichPayrollFinalizationRow,
  enrichPayrollProcessingRow,
  enrichPayslipBankRow,
  enrichSalaryComponentRow,
  enrichSalaryRevisionRow,
  enrichSalaryStructureRow,
  getActiveSalaryComponents,
  withComponentOptions,
  withEmployeeSelectOptions as withPayrollEmployeeSelectOptions,
  withStructureOptions,
} from "@/lib/payroll-module-utils";

const LEAVE_TYPE_OPTION_MODULES = new Set([
  "leave-entitlement",
  "leave-policy",
  "leave-allocation",
  "leave-application",
  "leave-approval",
  "leave-calendar",
  "leave-encashment",
]);

const LEAVE_EMPLOYEE_SELECT_MODULES = new Set([
  "leave-allocation",
  "leave-application",
  "leave-approval",
  "leave-calendar",
  "leave-encashment",
]);

export type ConfigModuleLookups = {
  employees: HrmsRow[];
  leaveTypes: HrmsRow[];
  salaryComponents: HrmsRow[];
  salaryStructures: HrmsRow[];
};

export function getConfigModuleLookups(): ConfigModuleLookups {
  return {
    employees: getHrmsMockRows("employees"),
    leaveTypes: getActiveLeaveTypes(),
    salaryComponents: getActiveSalaryComponents(),
    salaryStructures: getHrmsMockRows("payroll-salary-structure"),
  };
}

export function applyConfigFormOptions(
  moduleId: string,
  fields: FormField[],
  lookups: ConfigModuleLookups,
  rows: HrmsRow[],
  financialYearOptions?: Array<{ value: string; label: string }>,
): FormField[] {
  let next = fields;

  if (moduleId === "leave-entitlement") {
    const years =
      financialYearOptions && financialYearOptions.length > 0
        ? financialYearOptions.map((option) => option.value)
        : rows.map((row) => String(row.Financial_year ?? ""));
    const latest = latestFinancialYear(years);
    next = next.map((field) =>
      field.name === "Financial_year"
        ? {
            ...field,
            options: financialYearOptions?.length
              ? financialYearOptions
              : field.options,
            defaultValue: latest,
          }
        : field,
    );
  }

  if (LEAVE_EMPLOYEE_SELECT_MODULES.has(moduleId)) {
    next = withEmployeeSelectOptions(next, lookups.employees);
  }

  if (LEAVE_TYPE_OPTION_MODULES.has(moduleId)) {
    next = withLeaveTypeOptions(next, lookups.leaveTypes);
  }

  if (moduleId === "payroll-salary-revision" || moduleId === "payroll-payslip-bank") {
    next = withPayrollEmployeeSelectOptions(next, lookups.employees);
  }

  if (moduleId === "payroll-salary-structure") {
    next = withComponentOptions(next, lookups.salaryComponents);
  }

  if (moduleId === "payroll-salary-revision") {
    next = withStructureOptions(next, lookups.salaryStructures);
  }

  return next;
}

export function enrichConfigRow(
  moduleId: string,
  values: HrmsRow,
  lookups: ConfigModuleLookups,
  rows: HrmsRow[],
): HrmsRow {
  switch (moduleId) {
    case "leave-master":
      return enrichLeaveMasterRow(values);
    case "leave-policy":
      return enrichLeavePolicyRow(values, lookups.leaveTypes);
    case "leave-allocation":
      return enrichLeaveAllocationRow(values, lookups.employees, lookups.leaveTypes);
    case "leave-entitlement":
      return enrichLeaveEntitlementRow(values, lookups.leaveTypes);
    case "leave-application":
      return enrichLeaveApplicationRow(values, lookups.employees, lookups.leaveTypes);
    case "leave-requisition":
      return enrichLeaveRequisitionRow(values, lookups.employees, lookups.leaveTypes, rows);
    case "leave-approval":
      return enrichLeaveApprovalRow(values, lookups.employees);
    case "leave-calendar":
      return enrichLeaveCalendarRow(values, lookups.employees);
    case "leave-encashment":
      return enrichLeaveEncashmentRow(values, lookups.employees, lookups.leaveTypes);
    case "payroll-salary-components":
      return enrichSalaryComponentRow(values);
    case "payroll-salary-structure":
      return enrichSalaryStructureRow(values, lookups.salaryComponents);
    case "payroll-salary-revision":
      return enrichSalaryRevisionRow(values, lookups.employees);
    case "payroll-processing":
      return enrichPayrollProcessingRow(values);
    case "payroll-finalization":
      return enrichPayrollFinalizationRow(values);
    case "payroll-payslip-bank":
      return enrichPayslipBankRow(values, lookups.employees);
    default:
      return values;
  }
}

export function withLeaveEntitlementFilters<T extends { key: string; options?: unknown; defaultValue?: unknown }>(
  moduleId: string,
  fields: T[],
  financialYearOptions?: Array<{ value: string; label: string }>,
): T[] {
  if (moduleId !== "leave-entitlement") return fields;

  // Wait for API year options — mock defaults break filtering against real Year_Name values.
  if (!financialYearOptions?.length) {
    return fields.map((field) =>
      field.key === "Financial_year"
        ? { ...field, options: [], defaultValue: undefined }
        : field,
    );
  }

  const yearNameOptions = financialYearOptions.map((option) => ({
    value: option.label,
    label: option.label,
  }));
  const latest = latestFinancialYear(yearNameOptions.map((option) => option.value));

  return fields.map((field) =>
    field.key === "Financial_year"
      ? {
          ...field,
          options: yearNameOptions,
          defaultValue: latest,
        }
      : field,
  );
}

export function sortConfigRows(moduleId: string, rows: HrmsRow[]): HrmsRow[] {
  if (moduleId !== "leave-entitlement") return rows;
  return [...rows].sort((left, right) =>
    String(right.Financial_year ?? "").localeCompare(String(left.Financial_year ?? ""), undefined, {
      numeric: true,
    }),
  );
}
