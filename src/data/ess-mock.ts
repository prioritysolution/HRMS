import type { HrmsRow } from "@/types/hrms";
import { getHrmsMockRows } from "@/data/hrms-mock";

function row(id: string, data: Omit<HrmsRow, "id">): HrmsRow {
  return { id, ...data };
}

export const ESS_MOCK_DATA: Record<string, HrmsRow[]> = {
  "ess-announcements": [
    row("ann-1", {
      Title: "Office reopening schedule",
      Category: "General",
      Published_on: "2026-08-28",
      Summary: "Hybrid work policy updated for September. Review the new schedule in the HR portal.",
      Priority: "High",
      Status: "Active",
    }),
    row("ann-2", {
      Title: "Annual health check-up camp",
      Category: "Benefits",
      Published_on: "2026-08-25",
      Summary: "Free health screening on 10 Sep at Head Office. Register via ESS before 5 Sep.",
      Priority: "Normal",
      Status: "Active",
    }),
    row("ann-3", {
      Title: "Payroll cut-off reminder",
      Category: "Payroll",
      Published_on: "2026-08-22",
      Summary: "Submit pending reimbursement claims before 25 Aug for August payroll processing.",
      Priority: "High",
      Status: "Active",
    }),
  ],
  "ess-tasks": [
    row("task-1", {
      Task_title: "Complete self-appraisal form",
      Due_date: "2026-09-05",
      Category: "Performance",
      Priority: "High",
      Status: "Pending",
    }),
    row("task-2", {
      Task_title: "Acknowledge updated leave policy",
      Due_date: "2026-09-10",
      Category: "HR Policy",
      Priority: "Normal",
      Status: "Pending",
    }),
    row("task-3", {
      Task_title: "Update emergency contact details",
      Due_date: "2026-09-15",
      Category: "Profile",
      Priority: "Normal",
      Status: "Completed",
    }),
  ],
  "ess-tax": [
    row("tax-1", {
      Financial_year: "2025-26",
      Regime: "New Tax Regime",
      Gross_salary: 768000,
      Taxable_income: 612000,
      Tds_deducted: 48200,
      Form_16_status: "Available",
      Last_updated: "2026-08-15",
    }),
    row("tax-2", {
      Financial_year: "2024-25",
      Regime: "Old Tax Regime",
      Gross_salary: 720000,
      Taxable_income: 580000,
      Tds_deducted: 42100,
      Form_16_status: "Available",
      Last_updated: "2025-08-20",
    }),
  ],
  "ess-reimbursement": [
    row("reim-1", {
      Employee_code: "EMP-1001",
      Claim_type: "Travel",
      Claim_date: "2026-08-20",
      Amount: 4500,
      Description: "Client visit — Salt Lake to Park Street",
      Receipt_count: 2,
      Status: "Approved",
      Approved_on: "2026-08-25",
    }),
    row("reim-2", {
      Employee_code: "EMP-1001",
      Claim_type: "Meal",
      Claim_date: "2026-08-15",
      Amount: 850,
      Description: "Team lunch during project review",
      Receipt_count: 1,
      Status: "Pending",
      Approved_on: "",
    }),
  ],
  "ess-requests": [
    row("req-1", {
      Employee_code: "EMP-1001",
      Request_type: "Address Change",
      Submitted_on: "2026-08-18",
      Description: "Permanent address update — requires HR verification",
      Status: "Pending HR Approval",
      Requires_hr_approval: true,
    }),
    row("req-2", {
      Employee_code: "EMP-1001",
      Request_type: "ID Card Reissue",
      Submitted_on: "2026-08-10",
      Description: "Lost access card — request for reissue",
      Status: "Completed",
      Requires_hr_approval: false,
    }),
    row("req-3", {
      Employee_code: "EMP-1001",
      Request_type: "Bank Details Update",
      Submitted_on: "2026-08-05",
      Description: "Salary account change to HDFC",
      Status: "Pending HR Approval",
      Requires_hr_approval: true,
    }),
  ],
  "ess-performance": [
    row("perf-1", {
      Review_period: "H1 2026",
      Overall_rating: "Exceeds Expectations",
      Score: 4.2,
      Goals_completed: "8 / 10",
      Manager_feedback: "Strong delivery on design system initiative.",
      Self_review_status: "Submitted",
      Manager_review_status: "Completed",
      Status: "Closed",
    }),
    row("perf-2", {
      Review_period: "H2 2025",
      Overall_rating: "Meets Expectations",
      Score: 3.6,
      Goals_completed: "7 / 9",
      Manager_feedback: "Consistent contributor with room for leadership growth.",
      Self_review_status: "Submitted",
      Manager_review_status: "Completed",
      Status: "Closed",
    }),
  ],
  "ess-assets": [
    row("easset-1", {
      Employee_code: "EMP-1001",
      Asset_code: "AST-001",
      Asset_name: "Dell Latitude Laptop",
      Asset_type: "Laptop",
      Serial_number: "DL-2026-00125",
      Assigned_on: "2026-01-20",
      Condition: "Good",
      Status: "Assigned",
    }),
    row("easset-2", {
      Employee_code: "EMP-1001",
      Asset_code: "AST-002",
      Asset_name: "Samsung Galaxy S24",
      Asset_type: "Mobile",
      Serial_number: "SM-S24-78231",
      Assigned_on: "2026-02-12",
      Condition: "Good",
      Status: "Assigned",
    }),
  ],
  "ess-service-history": [
    row("esh-1", {
      Employee_code: "EMP-1001",
      Event_type: "Promotion",
      Event_date: "2025-04-01",
      From_value: "UI Designer",
      To_value: "Product Designer",
      Department: "Design",
      Remarks: "Annual promotion cycle",
    }),
    row("esh-2", {
      Employee_code: "EMP-1001",
      Event_type: "Transfer",
      Event_date: "2024-01-15",
      From_value: "Salt Lake Branch",
      To_value: "Head Office",
      Department: "Design",
      Remarks: "Branch consolidation",
    }),
    row("esh-3", {
      Employee_code: "EMP-1001",
      Event_type: "Confirmation",
      Event_date: "2023-04-01",
      From_value: "Probation",
      To_value: "Confirmed",
      Department: "Design",
      Remarks: "Successful probation completion",
    }),
  ],
};

const EMPLOYEE_SCOPED_MODULES: Record<string, string> = {
  "ess-attendance": "daily-attendance",
  "ess-monthly-attendance": "monthly-attendance",
  "ess-leave-balance": "leave-allocation",
  "ess-leave-history": "leave-application",
  "ess-payslips": "payroll-payslip-bank",
  "ess-reimbursement": "ess-reimbursement",
  "ess-requests": "ess-requests",
  "ess-assets": "ess-assets",
  "ess-service-history": "ess-service-history",
};

export function getEssMockRows(moduleId: string, employeeCode?: string | null): HrmsRow[] {
  const code = employeeCode ?? "EMP-1001";

  if (ESS_MOCK_DATA[moduleId]) {
    const rows = ESS_MOCK_DATA[moduleId].map((r) => ({ ...r }));
    if (rows.some((r) => "Employee_code" in r)) {
      return rows.filter((r) => r.Employee_code === code || !r.Employee_code);
    }
    return rows;
  }

  const hrmsKey = EMPLOYEE_SCOPED_MODULES[moduleId];
  if (hrmsKey) {
    return getHrmsMockRows(hrmsKey).filter((r) => r.Employee_code === code);
  }

  if (moduleId === "ess-holidays") {
    return getHrmsMockRows("holidays");
  }

  return [];
}

export function getEssDashboardData(employeeCode?: string | null) {
  const code = employeeCode ?? "EMP-1001";
  const todayAttendance = getHrmsMockRows("daily-attendance").find(
    (r) => r.Employee_code === code,
  );
  const monthlyAttendance = getHrmsMockRows("monthly-attendance").find(
    (r) => r.Employee_code === code,
  );
  const leaveBalance = getHrmsMockRows("leave-allocation").filter(
    (r) => r.Employee_code === code,
  );
  const pendingLeave = getHrmsMockRows("leave-application").filter(
    (r) => r.Employee_code === code && r.Application_status === "Pending",
  );
  const payslip = getHrmsMockRows("payroll-payslip-bank").find(
    (r) => r.Employee_code === code,
  );
  const holidays = getHrmsMockRows("holidays")
    .filter((h) => new Date(String(h.Holiday_date)) >= new Date("2026-08-31"))
    .slice(0, 4);
  const announcements = getEssMockRows("ess-announcements");
  const tasks = getEssMockRows("ess-tasks");
  const performance = getEssMockRows("ess-performance")[0];

  const totalLeaveBalance = leaveBalance.reduce(
    (sum, l) => sum + Number(l.Balance_days ?? 0),
    0,
  );

  return {
    todayAttendance,
    monthlyAttendance,
    leaveBalance,
    totalLeaveBalance,
    pendingLeave,
    payslip,
    holidays,
    announcements,
    tasks,
    performance,
  };
}
