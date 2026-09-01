import type { PayrollStatCard } from "@/components/payroll/PayrollModulePage";
import type { HrmsRow } from "@/types/hrms";

function sumField(rows: HrmsRow[], key: string): number {
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0);
}

export const PROCESSING_STATS: PayrollStatCard[] = [
  {
    title: "Payroll Runs",
    value: (rows) => String(rows.length),
    change: (rows) =>
      String(rows.filter((r) => String(r.Process_status) === "Completed").length),
    hint: "completed",
    description: "Monthly payroll processing batches",
    tone: "info",
    icon: "briefcase",
  },
  {
    title: "Gross Pay",
    value: (rows) => `₹${sumField(rows, "Gross_pay").toLocaleString("en-IN")}`,
    change: (rows) => `${sumField(rows, "Employees_count")} employees`,
    hint: "total",
    description: "Combined gross payroll amount",
    tone: "primary",
    icon: "users",
  },
  {
    title: "Net Pay",
    value: (rows) => `₹${sumField(rows, "Net_pay").toLocaleString("en-IN")}`,
    change: (rows) => `₹${sumField(rows, "Total_deductions").toLocaleString("en-IN")} deducted`,
    hint: "payout",
    description: "Net amount after statutory deductions",
    tone: "success",
    icon: "calendar",
  },
];

export const FINALIZATION_STATS: PayrollStatCard[] = [
  {
    title: "Pending",
    value: (rows) =>
      String(rows.filter((r) => String(r.Finalization_status) === "Pending").length),
    change: (rows) =>
      String(rows.filter((r) => String(r.Finalization_status) === "Finalized").length),
    hint: "finalized",
    description: "Batches awaiting finalization",
    tone: "warning",
    icon: "clock",
  },
  {
    title: "Statutory Total",
    value: (rows) => {
      const total =
        sumField(rows, "PF_amount") +
        sumField(rows, "ESI_amount") +
        sumField(rows, "PT_amount") +
        sumField(rows, "TDS_amount");
      return `₹${total.toLocaleString("en-IN")}`;
    },
    change: () => "PF/ESI/PT/TDS",
    hint: "compliance",
    description: "Configurable statutory deductions",
    tone: "info",
    icon: "briefcase",
  },
  {
    title: "Net Payout",
    value: (rows) => `₹${sumField(rows, "Net_pay").toLocaleString("en-IN")}`,
    change: (rows) =>
      String(rows.filter((r) => String(r.Bank_file_generated) === "Yes").length),
    hint: "bank files",
    description: "Finalized net payroll amount",
    tone: "success",
    icon: "users",
  },
];

export const PAYSLIP_STATS: PayrollStatCard[] = [
  {
    title: "Payslips",
    value: (rows) =>
      String(rows.filter((r) => String(r.Payslip_status) === "Generated").length),
    change: (rows) => `${rows.length} employees`,
    hint: "generated",
    description: "Payslips ready for distribution",
    tone: "success",
    icon: "users",
  },
  {
    title: "Bank Transfers",
    value: (rows) =>
      String(rows.filter((r) => String(r.Bank_transfer_status) === "Paid").length),
    change: (rows) =>
      String(rows.filter((r) => String(r.Bank_transfer_status) === "Pending").length),
    hint: "pending",
    description: "Salary credits via bank file",
    tone: "primary",
    icon: "briefcase",
  },
  {
    title: "Net Disbursed",
    value: (rows) => `₹${sumField(rows, "Net_pay").toLocaleString("en-IN")}`,
    change: () => "this cycle",
    hint: "paid",
    description: "Total net salary disbursed",
    tone: "info",
    icon: "calendar",
  },
];

export const REVISION_STATS: PayrollStatCard[] = [
  {
    title: "Revisions",
    value: (rows) => String(rows.length),
    change: (rows) =>
      String(rows.filter((r) => String(r.Revision_status) === "Approved").length),
    hint: "approved",
    description: "Salary revision records",
    tone: "info",
    icon: "users",
  },
  {
    title: "Avg Increment",
    value: (rows) => {
      if (rows.length === 0) return "0%";
      const total = rows.reduce((sum, row) => sum + Number(row.Increment_percent ?? 0), 0);
      return `${(total / rows.length).toFixed(1)}%`;
    },
    change: () => "gross",
    hint: "increase",
    description: "Average gross salary increment",
    tone: "success",
    icon: "calendar",
  },
  {
    title: "Pending Approval",
    value: (rows) =>
      String(rows.filter((r) => String(r.Revision_status) === "Pending").length),
    change: () => "review",
    hint: "queue",
    description: "Revisions awaiting approval",
    tone: "warning",
    icon: "clock",
  },
];
