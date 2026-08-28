export type NavChild = {
  label: string;
  href: string;
  exact?: boolean;
};

export type NavItem = {
  label: string;
  href?: string;
  icon:
    | "dashboard"
    | "organization"
    | "employees"
    | "attendance";
  children?: NavChild[];
};

export type NavSection = {
  title: string;
  icon: "dashboard";
  items: NavItem[];
};

export const APP_NAME = "Staffu";

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
          { label: "Organization", href: "/organization", exact: true },
          { label: "Branch / Office", href: "/organization/branches" },
          { label: "Department", href: "/organization/departments" },
          { label: "Designation", href: "/organization/designations" },
          { label: "Grade", href: "/organization/grades" },
          { label: "Employee Category", href: "/organization/employee-categories" },
          { label: "Employment Type", href: "/organization/employment-types" },
          { label: "Job Type", href: "/organization/job-types" },
          { label: "Shift", href: "/organization/shifts" },
          { label: "Salary Grade", href: "/organization/salary-grades" },
        ],
      },
      {
        label: "Employee Management",
        icon: "employees",
        children: [
          { label: "Employee List", href: "/employees", exact: true },
          { label: "Employee Profile", href: "/employees/profile" },
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
