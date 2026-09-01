/**
 * Maps Menu API `Route` values to Next.js App Router paths.
 * Backend routes may differ slightly from frontend page folders.
 */
const ROUTE_ALIASES: Record<string, string> = {
  // Organization Setup
  "/organization/profile": "/organization",
  "/organization/organization": "/organization",
  "/organization/organization-profile": "/organization",
  "/org/profile": "/organization",
  "/organization/branch": "/organization/branches",
  "/organization/branch-office": "/organization/branches",
  "/organization/branches": "/organization/branches",
  "/organization/department": "/organization/departments",
  "/organization/departments": "/organization/departments",
  "/organization/designation": "/organization/designations",
  "/organization/designations": "/organization/designations",
  "/organization/grade": "/organization/grades",
  "/organization/grades": "/organization/grades",
  "/organization/grade-level": "/organization/grades",
  "/organization/shift": "/organization/shifts",
  "/organization/shifts": "/organization/shifts",
  "/organization/employment-type": "/organization/employment-types",
  "/organization/employment-types": "/organization/employment-types",
  "/organization/employment-status": "/organization/employee-status",
  "/organization/employee-status": "/organization/employee-status",
  "/organization/job-type": "/organization/job-types",
  "/organization/job-types": "/organization/job-types",
  "/organization/salary-grade": "/organization/salary-grades",
  "/organization/salary-grades": "/organization/salary-grades",
  "/organization/holiday": "/attendance/holidays",
  "/organization/holiday-calendar": "/attendance/holidays",
  "/organization/holidays": "/attendance/holidays",
  "/organization/assets": "/organization/assets",
  "/organization/device": "/organization/device",
  "/organization/devices": "/organization/device",
  "/organization/device-setup": "/organization/device",

  // Employee Management
  "/employee": "/employees",
  "/employee/list": "/employees",
  "/employee/profile": "/employees",
  "/employees/list": "/employees",
  // Backend may label the employee master screen "Employee Profile" with this route.
  "/employees/profile": "/employees",
  "/employee/onboarding": "/employees/onboarding",
  "/employees/onboarding": "/employees/onboarding",
  "/employee/service-history": "/employees/service-history",
  "/employees/service-history": "/employees/service-history",
  "/employee/asset-allocation": "/employees/asset-allocation",
  "/employees/asset-allocation": "/employees/asset-allocation",
  "/organization/work-shift": "/organization/shifts",
  "/organization/work-shifts": "/organization/shifts",

  // Attendance
  "/attendance/dashboard": "/attendance",
  "/attendance/daily": "/attendance/daily",
  "/attendance/monthly": "/attendance/monthly",
  "/attendance/processing": "/attendance/processing",
  "/attendance/calendar": "/attendance/calendar",
  "/attendance/sources": "/attendance/sources",
  "/attendance/on-duty": "/attendance/on-duty",
  "/attendance/register": "/attendance/register",
  "/attendance/check-in-out": "/attendance/check-in-out",
  "/attendance/checkinout": "/attendance/check-in-out",
  "/attendance/regularization": "/attendance/regularization",
  "/attendance/missing-punch": "/attendance/missing-punch",
  "/attendance/overtime": "/attendance/overtime",
  "/attendance/shift": "/attendance/shifts",
  "/attendance/shifts": "/attendance/shifts",
  "/attendance/rules": "/attendance/rules",
  "/attendance/holiday": "/attendance/holidays",
  "/attendance/holidays": "/attendance/holidays",
  "/attendance/weekly-off": "/attendance/weekly-off",

  // Leave Management
  "/leave/master": "/leave/master",
  "/leave/leave-master": "/leave/master",
  "/leave/policy": "/leave/policy",
  "/leave/leave-policy": "/leave/policy",
  "/leave/allocation": "/leave/allocation",
  "/leave/leave-allocation": "/leave/allocation",
  "/leave/application": "/leave/application",
  "/leave/leave-application": "/leave/application",
  "/leave/approval": "/leave/approval",
  "/leave/leave-approval": "/leave/approval",
  "/leave/calendar": "/leave/calendar",
  "/leave/leave-calendar": "/leave/calendar",
  "/leave/encashment": "/leave/encashment",
  "/leave/leave-encashment": "/leave/encashment",

  // Payroll Management
  "/payroll/salary-components": "/payroll/salary-components",
  "/payroll/components": "/payroll/salary-components",
  "/payroll/salary-structure": "/payroll/salary-structure",
  "/payroll/structure": "/payroll/salary-structure",
  "/payroll/salary-revision": "/payroll/salary-revision",
  "/payroll/revision": "/payroll/salary-revision",
  "/payroll/processing": "/payroll/processing",
  "/payroll/payroll-processing": "/payroll/processing",
  "/payroll/finalization": "/payroll/finalization",
  "/payroll/payroll-finalization": "/payroll/finalization",
  "/payroll/payslip-bank": "/payroll/payslip-bank",
  "/payroll/payslip": "/payroll/payslip-bank",
  "/payroll/bank-transfer": "/payroll/payslip-bank",

  // Dashboard
  "/dashboard": "/dashboard",
  "/home": "/dashboard",

  // Employee Self Service
  "/ess": "/ess",
  "/ess/dashboard": "/ess",
  "/ess/my-dashboard": "/ess",
  "/ess/attendance": "/ess/attendance",
  "/ess/my-attendance": "/ess/attendance",
  "/ess/leave": "/ess/leave",
  "/ess/my-leave": "/ess/leave",
  "/ess/leave/apply": "/ess/leave/apply",
  "/ess/apply-leave": "/ess/leave/apply",
  "/ess/holidays": "/ess/holiday",
  "/ess/holiday-calendar": "/ess/holiday",
  "/ess/payslips": "/ess/payslips",
  "/ess/my-payslips": "/ess/payslips",
  "/ess/tax": "/ess/tax",
  "/ess/tds": "/ess/tax",
  "/ess/assets": "/ess/assets",
  "/ess/my-assets": "/ess/assets",
  "/ess/performance": "/ess/performance",
  "/ess/profile": "/ess/profile",
  "/ess/my-profile": "/ess/profile",
  "/ess/reimbursement": "/ess/reimbursement",
  "/ess/requests": "/ess/requests",
  "/ess/service-history": "/ess/service-history",
  "/ess/change-password": "/ess/change-password",
};

/**
 * Fallback when API route is missing or unmapped — resolve by submenu/menu label.
 */
const LABEL_ROUTES: Array<{ match: RegExp; href: string }> = [
  { match: /^organization\s*profile$/i, href: "/organization" },
  { match: /^organization$/i, href: "/organization" },
  { match: /^branch/i, href: "/organization/branches" },
  { match: /^department/i, href: "/organization/departments" },
  { match: /^designation/i, href: "/organization/designations" },
  { match: /^grade/i, href: "/organization/grades" },
  { match: /^shift\s*master$/i, href: "/organization/shifts" },
  { match: /^shift$/i, href: "/organization/shifts" },
  { match: /^employment\s*type/i, href: "/organization/employment-types" },
  { match: /^employment\s*status/i, href: "/organization/employee-categories" },
  { match: /^employee\s*categor/i, href: "/organization/employee-categories" },
  { match: /^job\s*type/i, href: "/organization/job-types" },
  { match: /^salary\s*grade/i, href: "/organization/salary-grades" },
  { match: /^asset\s*allocation$/i, href: "/employees/asset-allocation" },
  { match: /^assets?\s*(management|master)?$/i, href: "/organization/assets" },
  { match: /^device\s*(setup|master)?$/i, href: "/organization/device" },
  { match: /^holiday/i, href: "/attendance/holidays" },
  { match: /^employee\s*list$/i, href: "/employees" },
  { match: /^employee\s*profile$/i, href: "/employees" },
  { match: /^employee\s*onboarding$/i, href: "/employees/onboarding" },
  { match: /^onboarding$/i, href: "/employees/onboarding" },
  { match: /^service\s*history$/i, href: "/employees/service-history" },
  { match: /^weekly\s*off$/i, href: "/attendance/weekly-off" },
  { match: /^leave\s*master$/i, href: "/leave/master" },
  { match: /^leave\s*policy$/i, href: "/leave/policy" },
  { match: /^leave\s*allocation$/i, href: "/leave/allocation" },
  { match: /^leave\s*application$/i, href: "/leave/application" },
  { match: /^leave\s*approval$/i, href: "/leave/approval" },
  { match: /^leave\s*calendar$/i, href: "/leave/calendar" },
  { match: /^leave\s*encashment$/i, href: "/leave/encashment" },
  { match: /^leave\s*encashment$/i, href: "/leave/encashment" },
  { match: /^salary\s*components?$/i, href: "/payroll/salary-components" },
  { match: /^salary\s*structure$/i, href: "/payroll/salary-structure" },
  { match: /^salary\s*revision$/i, href: "/payroll/salary-revision" },
  { match: /^payroll\s*processing$/i, href: "/payroll/processing" },
  { match: /^payroll\s*finalization$/i, href: "/payroll/finalization" },
  { match: /^payslip(\s*&\s*bank\s*transfer)?$/i, href: "/payroll/payslip-bank" },
  { match: /^daily\s*attendance$/i, href: "/attendance/daily" },
  { match: /^monthly\s*attendance$/i, href: "/attendance/monthly" },
  { match: /^attendance\s*processing$/i, href: "/attendance/processing" },
  { match: /^attendance\s*calendar$/i, href: "/attendance/calendar" },
  { match: /^attendance\s*sources?$/i, href: "/attendance/sources" },
  { match: /^on[\s-]?duty$/i, href: "/attendance/on-duty" },
  { match: /^attendance\s*dashboard$/i, href: "/attendance" },
  { match: /^dashboard$/i, href: "/dashboard" },
  { match: /^my\s*dashboard$/i, href: "/ess" },
  { match: /^my\s*attendance$/i, href: "/ess/attendance" },
  { match: /^my\s*leave$/i, href: "/ess/leave" },
  { match: /^apply\s*leave$/i, href: "/ess/leave/apply" },
  { match: /^holiday\s*calendar$/i, href: "/ess/holiday" },
  { match: /^my\s*payslips?$/i, href: "/ess/payslips" },
  { match: /^tax(\s*\/\s*tds)?(\s*details)?$/i, href: "/ess/tax" },
  { match: /^my\s*assets?$/i, href: "/ess/assets" },
  { match: /^performance$/i, href: "/ess/performance" },
  { match: /^change\s*password$/i, href: "/ess/change-password" },
  { match: /^my\s*profile$/i, href: "/ess/profile" },
  { match: /^apply\s*(for\s*)?reimbursement$/i, href: "/ess/reimbursement" },
  { match: /^submit\s*requests?$/i, href: "/ess/requests" },
  { match: /^service\s*history$/i, href: "/ess/service-history" },
  { match: /^employee\s*self\s*service$/i, href: "/ess" },
];

function normalizePath(route: string): string {
  const trimmed = route.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

function extractRoutePath(route: string): string {
  const trimmed = route.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed;
  }

  try {
    return new URL(trimmed).pathname || "/";
  } catch {
    return trimmed;
  }
}

export function resolveAppRoute(
  apiRoute: string | null | undefined,
  label?: string | null,
): string | null {
  const raw = apiRoute?.trim();

  if (raw) {
    const path = normalizePath(extractRoutePath(raw));
    const aliased = ROUTE_ALIASES[path.toLowerCase()];
    if (aliased) return aliased;

    // Trust API route when it already matches an app section.
    if (
      path === "/organization" ||
      path.startsWith("/organization/") ||
      path === "/employees" ||
      path.startsWith("/employees/") ||
      path === "/attendance" ||
      path.startsWith("/attendance/") ||
      path === "/leave" ||
      path.startsWith("/leave/") ||
      path === "/dashboard" ||
      path.startsWith("/dashboard/") ||
      path.startsWith("/payroll/") ||
      path.startsWith("/reports/") ||
      path === "/ess" ||
      path.startsWith("/ess/")
    ) {
      return path;
    }

    return path;
  }

  const name = label?.trim();
  if (name) {
    for (const entry of LABEL_ROUTES) {
      if (entry.match.test(name)) return entry.href;
    }
  }

  return null;
}

/** Parent list pages that should only match exact path for active state. */
export function isExactNavRoute(href: string): boolean {
  return (
    href === "/dashboard" ||
    href === "/organization" ||
    href === "/employees" ||
    href === "/attendance" ||
    href === "/ess"
  );
}
