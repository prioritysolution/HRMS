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
  "/organization/employment-status": "/organization/employee-categories",
  "/organization/employee-category": "/organization/employee-categories",
  "/organization/employee-categories": "/organization/employee-categories",
  "/organization/job-type": "/organization/job-types",
  "/organization/job-types": "/organization/job-types",
  "/organization/salary-grade": "/organization/salary-grades",
  "/organization/salary-grades": "/organization/salary-grades",
  "/organization/holiday": "/attendance/holidays",
  "/organization/holiday-calendar": "/attendance/holidays",
  "/organization/holidays": "/attendance/holidays",

  // Employee Management
  "/employee": "/employees",
  "/employee/list": "/employees",
  "/employee/profile": "/employees",
  "/employees/list": "/employees",
  "/employees/profile": "/employees",
  "/employee/onboarding": "/employees/onboarding",
  "/employees/onboarding": "/employees/onboarding",
  "/employee/service-history": "/employees/service-history",
  "/employees/service-history": "/employees/service-history",
  "/organization/work-shift": "/organization/shifts",
  "/organization/work-shifts": "/organization/shifts",

  // Attendance
  "/attendance/dashboard": "/attendance",
  "/attendance/daily": "/attendance/daily",
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

  // Dashboard
  "/dashboard": "/dashboard",
  "/home": "/dashboard",
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
  { match: /^holiday/i, href: "/attendance/holidays" },
  { match: /^employee\s*list$/i, href: "/employees" },
  { match: /^employee\s*profile$/i, href: "/employees" },
  { match: /^employee\s*onboarding$/i, href: "/employees/onboarding" },
  { match: /^onboarding$/i, href: "/employees/onboarding" },
  { match: /^service\s*history$/i, href: "/employees/service-history" },
  { match: /^dashboard$/i, href: "/dashboard" },
];

function normalizePath(route: string): string {
  const trimmed = route.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function resolveAppRoute(
  apiRoute: string | null | undefined,
  label?: string | null,
): string | null {
  const raw = apiRoute?.trim();
  if (raw) {
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

    const path = normalizePath(raw);
    const aliased = ROUTE_ALIASES[path.toLowerCase()];
    if (aliased) return aliased;

    // Already a known app path — keep as-is
    if (
      path === "/organization" ||
      path.startsWith("/organization/") ||
      path === "/employees" ||
      path.startsWith("/employees/") ||
      path === "/attendance" ||
      path.startsWith("/attendance/") ||
      path === "/dashboard"
    ) {
      return path;
    }
  }

  const name = label?.trim();
  if (name) {
    for (const entry of LABEL_ROUTES) {
      if (entry.match.test(name)) return entry.href;
    }
  }

  // Last resort: use normalized API route even if unknown (page may exist later)
  if (raw) return normalizePath(raw);
  return null;
}

/** Parent list pages that should only match exact path for active state. */
export function isExactNavRoute(href: string): boolean {
  return (
    href === "/dashboard" ||
    href === "/organization" ||
    href === "/employees" ||
    href === "/attendance"
  );
}
