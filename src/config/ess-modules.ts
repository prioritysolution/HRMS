import type { FormField, HrmsModuleConfig } from "@/types/hrms";

const employeeHiddenKeys = new Set([
  "Employee_code",
  "Employee_name",
  "Employee_id",
]);

function withoutEmployeeColumns(columns: HrmsModuleConfig["columns"]) {
  return columns.filter((c) => !employeeHiddenKeys.has(c.key));
}

export const ESS_MODULES: Record<string, HrmsModuleConfig> = {
  "ess-attendance": {
    id: "ess-attendance",
    title: "My Attendance",
    section: "Employee Self Service",
    tableName: "ess_attendance",
    nameKey: "Attendance_date",
    columns: withoutEmployeeColumns([
      { key: "Attendance_date", header: "Date", type: "date" },
      { key: "Shift_name", header: "Shift" },
      { key: "Check_in", header: "Check In" },
      { key: "Check_out", header: "Check Out" },
      { key: "Working_minutes", header: "Working (min)" },
      { key: "Late_minutes", header: "Late (min)" },
      { key: "Source", header: "Source" },
      { key: "Attendance_status", header: "Status", type: "status" },
    ]),
    formFields: [],
    searchKeys: ["Attendance_date", "Attendance_status", "Shift_name"],
  },
  "ess-monthly-attendance": {
    id: "ess-monthly-attendance",
    title: "Monthly Attendance",
    section: "Employee Self Service",
    tableName: "ess_monthly_attendance",
    nameKey: "Month_year",
    columns: withoutEmployeeColumns([
      { key: "Month_year", header: "Month" },
      { key: "Present_days", header: "Present" },
      { key: "Absent_days", header: "Absent" },
      { key: "Half_day_days", header: "Half Days" },
      { key: "Late_days", header: "Late Days" },
      { key: "Overtime_hours", header: "OT Hours" },
      { key: "Attendance_status", header: "Status", type: "status" },
    ]),
    formFields: [],
    searchKeys: ["Month_year", "Attendance_status"],
  },
  "ess-leave-balance": {
    id: "ess-leave-balance",
    title: "My Leave Balance",
    section: "Employee Self Service",
    tableName: "ess_leave_balance",
    nameKey: "Leave_type",
    columns: withoutEmployeeColumns([
      { key: "Leave_type", header: "Leave Type" },
      { key: "Leave_code", header: "Code" },
      { key: "Year", header: "Year" },
      { key: "Allocated_days", header: "Allocated" },
      { key: "Used_days", header: "Used" },
      { key: "Balance_days", header: "Balance" },
      { key: "Status", header: "Status", type: "status" },
    ]),
    formFields: [],
    searchKeys: ["Leave_type", "Leave_code"],
  },
  "ess-leave-history": {
    id: "ess-leave-history",
    title: "My Leave History",
    section: "Employee Self Service",
    tableName: "ess_leave_history",
    nameKey: "Leave_type",
    columns: withoutEmployeeColumns([
      { key: "Leave_type", header: "Leave Type" },
      { key: "From_date", header: "From", type: "date" },
      { key: "To_date", header: "To", type: "date" },
      { key: "Number_of_days", header: "Days" },
      { key: "Reason", header: "Reason" },
      { key: "Applied_on", header: "Applied On", type: "date" },
      { key: "Application_status", header: "Status", type: "status" },
    ]),
    formFields: [],
    searchKeys: ["Leave_type", "Application_status", "Reason"],
  },
  "ess-leave-apply": {
    id: "ess-leave-apply",
    title: "Apply Leave",
    section: "Employee Self Service",
    tableName: "ess_leave_apply",
    nameKey: "Leave_type",
    actionLabel: "Apply Leave",
    columns: withoutEmployeeColumns([
      { key: "Leave_type", header: "Leave Type" },
      { key: "From_date", header: "From", type: "date" },
      { key: "To_date", header: "To", type: "date" },
      { key: "Number_of_days", header: "Days" },
      { key: "Reason", header: "Reason" },
      { key: "Application_status", header: "Status", type: "status" },
    ]),
    formFields: [
      {
        name: "Leave_type",
        label: "Leave Type",
        type: "select",
        required: true,
        options: [
          { value: "Casual Leave", label: "Casual Leave (CL)" },
          { value: "Sick Leave", label: "Sick Leave (SL)" },
          { value: "Earned Leave", label: "Earned Leave (EL)" },
          { value: "Comp Off", label: "Comp Off" },
        ],
      },
      { name: "From_date", label: "From Date", type: "date", required: true },
      { name: "To_date", label: "To Date", type: "date", required: true },
      { name: "Reason", label: "Reason", type: "textarea", required: true, span: "full" },
      { name: "Document_name", label: "Supporting Document", type: "file", span: "full" },
    ] as FormField[],
    searchKeys: ["Leave_type", "Application_status"],
  },
  "ess-holidays": {
    id: "ess-holidays",
    title: "Holiday Calendar",
    section: "Employee Self Service",
    tableName: "ess_holidays",
    nameKey: "Holiday_name",
    columns: [
      { key: "Holiday_date", header: "Date", type: "date" },
      { key: "Holiday_name", header: "Holiday" },
      { key: "Holiday_type", header: "Type" },
      { key: "Is_optional", header: "Optional", type: "boolean" },
    ],
    formFields: [],
    searchKeys: ["Holiday_name", "Holiday_type"],
  },
  "ess-payslips": {
    id: "ess-payslips",
    title: "My Payslips",
    section: "Employee Self Service",
    tableName: "ess_payslips",
    nameKey: "Payroll_month",
    columns: withoutEmployeeColumns([
      { key: "Payroll_month", header: "Month" },
      { key: "Pay_period", header: "Pay Period" },
      { key: "Gross_pay", header: "Gross Pay", type: "currency" },
      { key: "Total_deductions", header: "Deductions", type: "currency" },
      { key: "Net_pay", header: "Net Pay", type: "currency" },
      { key: "Payslip_status", header: "Status", type: "status" },
      { key: "Payment_date", header: "Paid On", type: "date" },
    ]),
    formFields: [],
    searchKeys: ["Payroll_month", "Payslip_status"],
  },
  "ess-tax": {
    id: "ess-tax",
    title: "Tax / TDS Details",
    section: "Employee Self Service",
    tableName: "ess_tax",
    nameKey: "Financial_year",
    columns: [
      { key: "Financial_year", header: "Financial Year" },
      { key: "Regime", header: "Tax Regime" },
      { key: "Gross_salary", header: "Gross Salary", type: "currency" },
      { key: "Taxable_income", header: "Taxable Income", type: "currency" },
      { key: "Tds_deducted", header: "TDS Deducted", type: "currency" },
      { key: "Form_16_status", header: "Form 16", type: "status" },
      { key: "Last_updated", header: "Last Updated", type: "date" },
    ],
    formFields: [],
    searchKeys: ["Financial_year", "Regime"],
  },
  "ess-assets": {
    id: "ess-assets",
    title: "My Assets",
    section: "Employee Self Service",
    tableName: "ess_assets",
    nameKey: "Asset_name",
    columns: withoutEmployeeColumns([
      { key: "Asset_code", header: "Asset Code" },
      { key: "Asset_name", header: "Asset Name" },
      { key: "Asset_type", header: "Type" },
      { key: "Serial_number", header: "Serial No." },
      { key: "Assigned_on", header: "Assigned On", type: "date" },
      { key: "Condition", header: "Condition" },
      { key: "Status", header: "Status", type: "status" },
    ]),
    formFields: [],
    searchKeys: ["Asset_name", "Asset_type", "Status"],
  },
  "ess-performance": {
    id: "ess-performance",
    title: "Performance",
    section: "Employee Self Service",
    tableName: "ess_performance",
    nameKey: "Review_period",
    columns: [
      { key: "Review_period", header: "Review Period" },
      { key: "Overall_rating", header: "Rating" },
      { key: "Score", header: "Score" },
      { key: "Goals_completed", header: "Goals" },
      { key: "Self_review_status", header: "Self Review", type: "status" },
      { key: "Manager_review_status", header: "Manager Review", type: "status" },
      { key: "Status", header: "Status", type: "status" },
    ],
    formFields: [],
    searchKeys: ["Review_period", "Overall_rating"],
  },
  "ess-reimbursement": {
    id: "ess-reimbursement",
    title: "Apply for Reimbursement",
    section: "Employee Self Service",
    tableName: "ess_reimbursement",
    nameKey: "Claim_type",
    actionLabel: "Submit Claim",
    columns: withoutEmployeeColumns([
      { key: "Claim_type", header: "Type" },
      { key: "Claim_date", header: "Date", type: "date" },
      { key: "Amount", header: "Amount", type: "currency" },
      { key: "Description", header: "Description" },
      { key: "Receipt_count", header: "Receipts" },
      { key: "Status", header: "Status", type: "status" },
    ]),
    formFields: [
      {
        name: "Claim_type",
        label: "Claim Type",
        type: "select",
        required: true,
        options: [
          { value: "Travel", label: "Travel" },
          { value: "Meal", label: "Meal" },
          { value: "Medical", label: "Medical" },
          { value: "Communication", label: "Communication" },
          { value: "Other", label: "Other" },
        ],
      },
      { name: "Claim_date", label: "Expense Date", type: "date", required: true },
      { name: "Amount", label: "Amount (₹)", type: "number", required: true },
      { name: "Description", label: "Description", type: "textarea", required: true, span: "full" },
      { name: "Receipt_count", label: "Number of Receipts", type: "number", required: true },
    ] as FormField[],
    searchKeys: ["Claim_type", "Status", "Description"],
  },
  "ess-requests": {
    id: "ess-requests",
    title: "Submit Requests",
    section: "Employee Self Service",
    tableName: "ess_requests",
    nameKey: "Request_type",
    actionLabel: "Submit Request",
    columns: withoutEmployeeColumns([
      { key: "Request_type", header: "Request Type" },
      { key: "Submitted_on", header: "Submitted", type: "date" },
      { key: "Description", header: "Description" },
      { key: "Requires_hr_approval", header: "HR Approval", type: "boolean" },
      { key: "Status", header: "Status", type: "status" },
    ]),
    formFields: [
      {
        name: "Request_type",
        label: "Request Type",
        type: "select",
        required: true,
        options: [
          { value: "Address Change", label: "Address Change (HR approval required)" },
          { value: "Bank Details Update", label: "Bank Details Update (HR approval required)" },
          { value: "Name Correction", label: "Name Correction (HR approval required)" },
          { value: "ID Card Reissue", label: "ID Card Reissue" },
          { value: "Experience Letter", label: "Experience Letter" },
          { value: "Other", label: "Other" },
        ],
      },
      { name: "Description", label: "Details", type: "textarea", required: true, span: "full" },
    ] as FormField[],
    searchKeys: ["Request_type", "Status"],
  },
  "ess-service-history": {
    id: "ess-service-history",
    title: "Service History",
    section: "Employee Self Service",
    tableName: "ess_service_history",
    nameKey: "Event_type",
    columns: withoutEmployeeColumns([
      { key: "Event_type", header: "Event" },
      { key: "Event_date", header: "Date", type: "date" },
      { key: "From_value", header: "From" },
      { key: "To_value", header: "To" },
      { key: "Department", header: "Department" },
      { key: "Remarks", header: "Remarks" },
    ]),
    formFields: [],
    searchKeys: ["Event_type", "Department"],
  },
};

export function getEssModule(moduleId: string): HrmsModuleConfig {
  const mod = ESS_MODULES[moduleId];
  if (!mod) {
    throw new Error(`Unknown ESS module: ${moduleId}`);
  }
  return mod;
}

export function getEssFormFields(moduleId: string): FormField[] {
  return getEssModule(moduleId).formFields ?? [];
}

export function getEssModuleDescription(moduleId: string): string {
  const descriptions: Record<string, string> = {
    "ess-attendance": "View your daily attendance records.",
    "ess-leave-apply": "Submit a new leave application for manager approval.",
    "ess-holidays": "Company holidays for the year.",
    "ess-payslips": "View and download your payslips.",
    "ess-tax": "Tax deductions and Form 16 information.",
    "ess-assets": "Assets assigned to you by the organization.",
    "ess-performance": "Your performance reviews and ratings.",
    "ess-reimbursement": "Submit expense reimbursement claims.",
    "ess-requests": "Submit HR service requests. Critical changes require HR approval.",
    "ess-service-history": "Your employment history and career milestones.",
  };
  return descriptions[moduleId] ?? "";
}
