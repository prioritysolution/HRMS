export type NavChild = {
  label: string;
  href: string;
  exact?: boolean;
};

export type NavIcon =
  | "dashboard"
  | "organization"
  | "employees"
  | "attendance"
  | "payroll"
  | "reports"
  | "settings"
  | "helpdesk"
  | "ess";

export type NavItem = {
  label: string;
  href?: string;
  icon: NavIcon;
  children?: NavChild[];
};

export type NavSection = {
  title: string;
  icon: "dashboard";
  items: NavItem[];
};

export const APP_NAME = "Staffu";

/** Fallback navigation used when the menu API is unavailable. */
export const navigation: NavSection[] = [
  {
    title: "",
    icon: "dashboard",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
      {
        label: "Organization Setup",
        icon: "organization",
        children: [
          { label: "Organization Profile", href: "/organization", exact: true },
          { label: "Branch / Office Master", href: "/organization/branches" },
          { label: "Department Master", href: "/organization/departments" },
          { label: "Designation Master", href: "/organization/designations" },
          { label: "Grade / Level Master", href: "/organization/grades" },
          { label: "Shift Master", href: "/organization/shifts" },
          { label: "Employment Type", href: "/organization/employment-types" },
          { label: "Employment Status", href: "/organization/employee-status" },
          { label: "Salary Grade", href: "/organization/salary-grades" },
          { label: "Holiday Calendar", href: "/attendance/holidays" },
          { label: "Asset Management", href: "/organization/assets" },
          { label: "Device Setup", href: "/organization/device" },

        ],
      },
      {
        label: "Employee Management",
        icon: "employees",
        children: [
          { label: "Employee Profile", href: "/employees", exact: true },
          { label: "Employee Onboarding", href: "/employees/onboarding" },
          { label: "Service History", href: "/employees/service-history" },
          { label: "Asset Allocation", href: "/employees/asset-allocation" },

        ],
      },
      {
        label: "Attendance Management",
        icon: "attendance",
        children: [
          { label: "Attendance Dashboard", href: "/attendance", exact: true },
          { label: "Daily Attendance", href: "/attendance/daily" },
          { label: "Monthly Attendance", href: "/attendance/monthly" },
          { label: "Attendance Processing", href: "/attendance/processing" },
          { label: "Attendance Calendar", href: "/attendance/calendar" },
          { label: "Attendance Sources", href: "/attendance/sources" },
          { label: "Check-in / Check-out", href: "/attendance/check-in-out" },
          { label: "Attendance Register", href: "/attendance/register" },
          { label: "Attendance Regularization", href: "/attendance/regularization" },
          { label: "Missing Punch", href: "/attendance/missing-punch" },
          { label: "Overtime", href: "/attendance/overtime" },
          { label: "On-Duty", href: "/attendance/on-duty" },
          { label: "Shift Management", href: "/attendance/shifts" },
          { label: "Attendance Rules", href: "/attendance/rules" },
          { label: "Holidays", href: "/attendance/holidays" },
          { label: "Weekly Off", href: "/attendance/weekly-off" },
        ],
      },
      {
        label: "Leave Management",
        icon: "attendance",
        children: [
          { label: "Leave Master", href: "/leave/master" },
          { label: "Leave Policy", href: "/leave/policy" },
          { label: "Leave Allocation", href: "/leave/allocation" },
          { label: "Leave Application", href: "/leave/application" },
          { label: "Leave Approval", href: "/leave/approval" },
          { label: "Leave Calendar", href: "/leave/calendar" },
          { label: "Leave Encashment", href: "/leave/encashment" },
        ],
      },
      {
        label: "Payroll Management",
        icon: "payroll",
        children: [
          { label: "Salary Components", href: "/payroll/salary-components" },
          { label: "Salary Structure", href: "/payroll/salary-structure" },
          { label: "Salary Revision", href: "/payroll/salary-revision" },
          { label: "Payroll Processing", href: "/payroll/processing" },
          { label: "Payroll Finalization", href: "/payroll/finalization" },
          { label: "Payslip & Bank Transfer", href: "/payroll/payslip-bank" },
        ],
      },
      {
        label: "Employee Self Service",
        icon: "ess",
        children: [
          { label: "My Dashboard", href: "/ess", exact: true },
          { label: "My Attendance", href: "/ess/attendance" },
          { label: "My Leave", href: "/ess/leave" },
          { label: "Apply Leave", href: "/ess/leave/apply" },
          { label: "Holiday Calendar", href: "/ess/holiday" },
          { label: "My Payslips", href: "/ess/payslips" },
          { label: "Tax / TDS Details", href: "/ess/tax" },
          { label: "My Assets", href: "/ess/assets" },
          { label: "Performance", href: "/ess/performance" },
          { label: "My Profile", href: "/ess/profile" },
          { label: "Apply Reimbursement", href: "/ess/reimbursement" },
          { label: "Submit Requests", href: "/ess/requests" },
          { label: "Service History", href: "/ess/service-history" },
          { label: "Change Password", href: "/ess/change-password" },
        ],
      },
      {
        label: "Attendance Reports",
        icon: "attendance",
        children: [
          { label: "Employee-wise Attendance", href: "/reports/attendance/employee" },
        ],
      },
      {
        label: "Employee Reports",
        icon: "reports",
        children: [
          { label: "Employee Register", href: "/reports/employee/register" },
          { label: "Service History", href: "/reports/employee/history" },
        ],
      },
    ],
  },
];
