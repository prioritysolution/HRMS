import type { FormField, HrmsRow } from "@/types/hrms";
import { getHrmsMockRows } from "@/data/hrms-mock";
import {
  enrichEmployeeAttendanceRow,
  withEmployeeSelectOptions,
} from "@/lib/attendance-module-utils";

export function getActiveSalaryComponents(): HrmsRow[] {
  return getHrmsMockRows("payroll-salary-components").filter((row) => {
    const status = String(row.Status ?? "Active").toLowerCase();
    return status === "active" || status === "1";
  });
}

export function getEarningComponents(): HrmsRow[] {
  return getActiveSalaryComponents().filter(
    (row) => String(row.Component_type ?? "").toLowerCase() === "earning",
  );
}

export function getDeductionComponents(): HrmsRow[] {
  return getActiveSalaryComponents().filter(
    (row) => String(row.Component_type ?? "").toLowerCase() === "deduction",
  );
}

export function selectOptionsFromComponents(
  components: HrmsRow[],
): Array<{ value: string; label: string }> {
  return components
    .map((row) => {
      const code = String(row.Component_code ?? "").trim();
      const name = String(row.Component_name ?? code).trim();
      if (!name) return null;
      return { value: name, label: code ? `${name} (${code})` : name };
    })
    .filter((option): option is { value: string; label: string } => option !== null);
}

export function selectOptionsFromStructures(
  structures: HrmsRow[],
): Array<{ value: string; label: string }> {
  return structures
    .map((row) => {
      const name = String(row.Structure_name ?? "").trim();
      if (!name) return null;
      const code = String(row.Structure_code ?? "").trim();
      return { value: name, label: code ? `${name} (${code})` : name };
    })
    .filter((option): option is { value: string; label: string } => option !== null);
}

export function withComponentOptions(fields: FormField[], components: HrmsRow[]): FormField[] {
  const options = selectOptionsFromComponents(components);
  if (options.length === 0) return fields;

  return fields.map((field) => {
    if (field.name === "Component_name" || field.name === "Primary_component") {
      return { ...field, options };
    }
    return field;
  });
}

export function withStructureOptions(fields: FormField[], structures: HrmsRow[]): FormField[] {
  const options = selectOptionsFromStructures(structures);
  if (options.length === 0) return fields;

  return fields.map((field) => {
    if (field.name === "Salary_structure" || field.name === "Structure_name") {
      return { ...field, options };
    }
    return field;
  });
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function yesNo(value: unknown, fallback = "No"): string {
  if (value === true || value === "true" || value === 1 || value === "Yes") return "Yes";
  if (value === false || value === "false" || value === 0 || value === "No") return "No";
  return String(value ?? fallback);
}

export function enrichSalaryComponentRow(values: HrmsRow): HrmsRow {
  const code = String(values.Component_code ?? "").trim().toUpperCase();
  const name = String(values.Component_name ?? "").trim();
  const type = String(values.Component_type ?? "Earning");

  return {
    ...values,
    id: String(values.id ?? `psc-${Date.now()}`),
    Component_code: code,
    Component_name: name,
    Component_type: type,
    Calculation_type: String(values.Calculation_type ?? "Fixed Amount"),
    Default_value: toNumber(values.Default_value),
    PF_applicable: yesNo(values.PF_applicable),
    ESI_applicable: yesNo(values.ESI_applicable),
    PT_applicable: yesNo(values.PT_applicable),
    TDS_applicable: yesNo(values.TDS_applicable),
    Taxable: yesNo(values.Taxable, "Yes"),
    Display_order: toNumber(values.Display_order),
    Status: String(values.Status ?? "Active"),
  };
}

export function enrichSalaryStructureRow(values: HrmsRow, components: HrmsRow[]): HrmsRow {
  const structureName = String(values.Structure_name ?? "").trim();
  const componentName = String(values.Component_name ?? values.Primary_component ?? "").trim();
  const matched = components.find((row) => String(row.Component_name ?? "").trim() === componentName);
  const amountValue = toNumber(values.Amount_value ?? values.Default_value);
  const amountType = String(values.Amount_type ?? "Fixed");

  let computedAmount = amountValue;
  if (amountType.toLowerCase().includes("percent")) {
    const basic = toNumber(values.Basic_salary);
    computedAmount = Math.round((basic * amountValue) / 100);
  }

  const basic = toNumber(values.Basic_salary);
  const gross =
    toNumber(values.Gross_salary) ||
    basic +
      toNumber(values.HRA) +
      toNumber(values.Conveyance) +
      toNumber(values.Medical_allowance) +
      toNumber(values.Special_allowance) +
      toNumber(values.Other_allowances);
  const deductions =
    toNumber(values.Total_deductions) ||
    toNumber(values.PF) +
      toNumber(values.ESI) +
      toNumber(values.Professional_tax) +
      toNumber(values.TDS) +
      toNumber(values.Loan_recovery) +
      toNumber(values.Advance_recovery) +
      toNumber(values.Leave_without_pay) +
      toNumber(values.Other_deductions);
  const net = toNumber(values.Net_salary) || Math.max(gross - deductions, 0);

  return {
    ...values,
    id: String(values.id ?? `pss-${Date.now()}`),
    Structure_code: String(values.Structure_code ?? "").trim().toUpperCase(),
    Structure_name: structureName,
    Component_name: componentName,
    Component_code: String(matched?.Component_code ?? values.Component_code ?? ""),
    Component_type: String(matched?.Component_type ?? values.Component_type ?? ""),
    Applicable_to: String(values.Applicable_to ?? "All Employees"),
    Amount_type: amountType,
    Amount_value: amountValue,
    Computed_amount: computedAmount,
    Basic_salary: basic,
    HRA: toNumber(values.HRA),
    Conveyance: toNumber(values.Conveyance),
    Medical_allowance: toNumber(values.Medical_allowance),
    Special_allowance: toNumber(values.Special_allowance),
    Other_allowances: toNumber(values.Other_allowances),
    Incentives: toNumber(values.Incentives),
    Bonus: toNumber(values.Bonus),
    Overtime: toNumber(values.Overtime),
    Gross_salary: gross,
    PF: toNumber(values.PF),
    ESI: toNumber(values.ESI),
    Professional_tax: toNumber(values.Professional_tax),
    TDS: toNumber(values.TDS),
    Loan_recovery: toNumber(values.Loan_recovery),
    Advance_recovery: toNumber(values.Advance_recovery),
    Leave_without_pay: toNumber(values.Leave_without_pay),
    Other_deductions: toNumber(values.Other_deductions),
    Total_deductions: deductions,
    Net_salary: net,
    Effective_from: String(values.Effective_from ?? ""),
    Statutory_rule_set: String(values.Statutory_rule_set ?? "India - Default"),
    Status: String(values.Status ?? "Active"),
  };
}

export function enrichSalaryRevisionRow(values: HrmsRow, employees: HrmsRow[]): HrmsRow {
  const base = enrichEmployeeAttendanceRow(values, employees);
  const oldBasic = toNumber(values.Old_basic);
  const newBasic = toNumber(values.New_basic);
  const oldGross = toNumber(values.Old_gross);
  const newGross = toNumber(values.New_gross);

  return {
    ...base,
    id: String(values.id ?? `psr-${Date.now()}`),
    Salary_structure: String(values.Salary_structure ?? values.Structure_name ?? ""),
    Revision_type: String(values.Revision_type ?? "Annual Increment"),
    Old_basic: oldBasic,
    New_basic: newBasic,
    Old_gross: oldGross,
    New_gross: newGross,
    Increment_amount: Math.max(newGross - oldGross, 0),
    Increment_percent:
      oldGross > 0 ? Number((((newGross - oldGross) / oldGross) * 100).toFixed(2)) : 0,
    Effective_date: String(values.Effective_date ?? ""),
    Reason: String(values.Reason ?? "").trim(),
    Approved_by: String(values.Approved_by ?? "HR Manager"),
    Revision_status: String(values.Revision_status ?? "Pending"),
  };
}

export function enrichPayrollProcessingRow(values: HrmsRow): HrmsRow {
  const gross = toNumber(values.Gross_pay);
  const deductions = toNumber(values.Total_deductions);
  const net = toNumber(values.Net_pay) || Math.max(gross - deductions, 0);
  const count = toNumber(values.Employees_count);

  return {
    ...values,
    id: String(values.id ?? `pp-${Date.now()}`),
    Payroll_month: String(values.Payroll_month ?? ""),
    Pay_period: String(values.Pay_period ?? values.Payroll_month ?? ""),
    Employees_count: count,
    Gross_pay: gross,
    Total_deductions: deductions,
    Net_pay: net,
    PF_total: toNumber(values.PF_total),
    ESI_total: toNumber(values.ESI_total),
    PT_total: toNumber(values.PT_total),
    TDS_total: toNumber(values.TDS_total),
    Process_status: String(values.Process_status ?? "Draft"),
    Processed_on: String(values.Processed_on ?? ""),
    Processed_by: String(values.Processed_by ?? "Payroll Executive"),
    Statutory_rule_set: String(values.Statutory_rule_set ?? "India - Default"),
  };
}

export function enrichPayrollFinalizationRow(values: HrmsRow): HrmsRow {
  const gross = toNumber(values.Gross_pay);
  const net = toNumber(values.Net_pay);

  return {
    ...values,
    id: String(values.id ?? `pfz-${Date.now()}`),
    Payroll_month: String(values.Payroll_month ?? ""),
    Batch_ref: String(values.Batch_ref ?? `PAY-${Date.now()}`),
    Employees_count: toNumber(values.Employees_count),
    Gross_pay: gross,
    Net_pay: net,
    PF_amount: toNumber(values.PF_amount),
    ESI_amount: toNumber(values.ESI_amount),
    PT_amount: toNumber(values.PT_amount),
    TDS_amount: toNumber(values.TDS_amount),
    Loan_recovery_total: toNumber(values.Loan_recovery_total),
    Advance_recovery_total: toNumber(values.Advance_recovery_total),
    Finalization_status: String(values.Finalization_status ?? "Pending"),
    Finalized_on: String(values.Finalized_on ?? ""),
    Finalized_by: String(values.Finalized_by ?? "Payroll Manager"),
    Register_generated: yesNo(values.Register_generated, "No"),
    Bank_file_generated: yesNo(values.Bank_file_generated, "No"),
  };
}

export function enrichPayslipBankRow(values: HrmsRow, employees: HrmsRow[]): HrmsRow {
  const base = enrichEmployeeAttendanceRow(values, employees);
  const gross = toNumber(values.Gross_pay);
  const deductions = toNumber(values.Total_deductions);
  const net = toNumber(values.Net_pay) || Math.max(gross - deductions, 0);

  return {
    ...base,
    id: String(values.id ?? `pps-${Date.now()}`),
    Payroll_month: String(values.Payroll_month ?? ""),
    Pay_period: String(values.Pay_period ?? values.Payroll_month ?? ""),
    Gross_pay: gross,
    Total_deductions: deductions,
    Net_pay: net,
    Payslip_status: String(values.Payslip_status ?? "Generated"),
    Bank_transfer_status: String(values.Bank_transfer_status ?? "Pending"),
    Bank_account_no: String(values.Bank_account_no ?? ""),
    IFSC_code: String(values.IFSC_code ?? ""),
    UTR_ref: String(values.UTR_ref ?? ""),
    Payment_date: String(values.Payment_date ?? ""),
    Settlement_type: String(values.Settlement_type ?? "Regular Payroll"),
  };
}

export function countByPayrollStatus(rows: HrmsRow[], status: string): string {
  return String(
    rows.filter((row) => {
      const value = String(
        row.Process_status ??
          row.Finalization_status ??
          row.Payslip_status ??
          row.Bank_transfer_status ??
          row.Revision_status ??
          "",
      );
      return value.toLowerCase() === status.toLowerCase();
    }).length,
  );
}

export { withEmployeeSelectOptions };
