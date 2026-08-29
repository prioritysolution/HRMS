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

        ],
      },
      {
        label: "Employee Management",
        icon: "employees",
        children: [
          { label: "Employee Profile", href: "/employees", exact: true },
          { label: "Employee Onboarding", href: "/employees/onboarding" },
          { label: "Service History", href: "/employees/service-history" },
          
        ],
      },
      {
        label: "Attendance Management",
        icon: "attendance",
        children: [
          { label: "Attendance Dashboard", href: "/attendance", exact: true },
          { label: "Daily Attendance", href: "/attendance/daily" },
          { label: "Attendance Register", href: "/attendance/register" },
          { label: "Check-in / Check-out", href: "/attendance/check-in-out" },
          { label: "Attendance Regularization", href: "/attendance/regularization" },
          { label: "Missing Punch", href: "/attendance/missing-punch" },
          { label: "Overtime", href: "/attendance/overtime" },
          { label: "Shift Management", href: "/attendance/shifts" },
          { label: "Attendance Rules", href: "/attendance/rules" },
          { label: "Holidays", href: "/attendance/holidays" },
          { label: "Weekly Off", href: "/attendance/weekly-off" },
        ],
      },
    ],
  },
];
