export const API_ENDPOINTS = {
  organization: {
    list: "/api/v1/organization/list",
    get: (id: string | number) => `/api/v1/organization/get/${id}`,
    getByCode: (code: string) => `/api/v1/organization/get-by-code/${encodeURIComponent(code)}`,
    create: "/api/v1/organization/create",
    update: (id: string | number) => `/api/v1/organization/update/${id}`,
    delete: (id: string | number) => `/api/v1/organization/delete/${id}`,
  },
  branch: {
    list: "/api/v1/branch/list",
    get: (id: string | number) => `/api/v1/branch/get/${id}`,
    getByCode: (orgId: string | number, code: string) =>
      `/api/v1/branch/get-by-code/${encodeURIComponent(String(orgId))}/${encodeURIComponent(code)}`,
    create: "/api/v1/branch/create",
    update: (id: string | number) => `/api/v1/branch/update/${id}`,
    delete: (id: string | number) => `/api/v1/branch/delete/${id}`,
  },
  department: {
    list: "/api/v1/department/list",
    get: (id: string | number) => `/api/v1/department/get/${id}`,
    getByCode: (orgId: string | number, code: string) =>
      `/api/v1/department/get-by-code/${encodeURIComponent(String(orgId))}/${encodeURIComponent(code)}`,
    create: "/api/v1/department/create",
    update: (id: string | number) => `/api/v1/department/update/${id}`,
    delete: (id: string | number) => `/api/v1/department/delete/${id}`,
  },
  designation: {
    list: "/api/v1/designation/list",
    get: (id: string | number) => `/api/v1/designation/get/${id}`,
    getByCode: (orgId: string | number, code: string) =>
      `/api/v1/designation/get-by-code/${encodeURIComponent(String(orgId))}/${encodeURIComponent(code)}`,
    create: "/api/v1/designation/create",
    update: (id: string | number) => `/api/v1/designation/update/${id}`,
    delete: (id: string | number) => `/api/v1/designation/delete/${id}`,
  },
  grade: {
    list: "/api/v1/grade/list",
    get: (id: string | number) => `/api/v1/grade/get/${id}`,
    getByCode: (orgId: string | number, code: string) =>
      `/api/v1/grade/get-by-code/${encodeURIComponent(String(orgId))}/${encodeURIComponent(code)}`,
    create: "/api/v1/grade/create",
    update: (id: string | number) => `/api/v1/grade/update/${id}`,
    delete: (id: string | number) => `/api/v1/grade/delete/${id}`,
  },
  employmentType: {
    list: "/api/v1/employment-type/list",
    get: (id: string | number) => `/api/v1/employment-type/get/${id}`,
    getByCode: (orgId: string | number, code: string) =>
      `/api/v1/employment-type/get-by-code/${encodeURIComponent(String(orgId))}/${encodeURIComponent(code)}`,
    create: "/api/v1/employment-type/create",
    update: (id: string | number) => `/api/v1/employment-type/update/${id}`,
    delete: (id: string | number) => `/api/v1/employment-type/delete/${id}`,
  },
  employmentStatus: {
    list: "/api/v1/employment-status/list",
    get: (id: string | number) =>
      `/api/v1/employment-status/list?emp_status_id=${encodeURIComponent(String(id))}`,
    create: "/api/v1/employment-status/create",
    update: (id: string | number) =>
      `/api/v1/employment-status/update/${id}`,
    delete: (id: string | number) =>
      `/api/v1/employment-status/delete/${id}`,
  },
  holiday: {
    list: "/api/v1/holiday/list",

    get: (id: string | number) =>
      `/api/v1/holiday/list?holiday_id=${encodeURIComponent(String(id))}`,

    create: "/api/v1/holiday/create",

    update: (id: string | number) =>
      `/api/v1/holiday/update/${id}`,

    delete: (id: string | number) =>
      `/api/v1/holiday/delete/${id}`,
  },
  workShift: {
    list: "/api/v1/work-shift/list",
    get: (id: string | number) => `/api/v1/work-shift/get/${id}`,
    getByCode: (orgId: string | number, code: string) =>
      `/api/v1/work-shift/get-by-code/${encodeURIComponent(String(orgId))}/${encodeURIComponent(code)}`,
    create: "/api/v1/work-shift/create",
    update: (id: string | number) => `/api/v1/work-shift/update/${id}`,
    delete: (id: string | number) => `/api/v1/work-shift/delete/${id}`,
  },
  gradeSalary: {
    list: "/api/v1/grade-salary/list",
    get: (id: string | number) => `/api/v1/grade-salary/get/${id}`,
    create: "/api/v1/grade-salary/create",
    update: (id: string | number) => `/api/v1/grade-salary/update/${id}`,
    delete: (id: string | number) => `/api/v1/grade-salary/delete/${id}`,
  },
  asset: {
    list: "/api/v1/asset/list",
    create: "/api/v1/asset/create",
    update: (id: string | number) => `/api/v1/asset/update/${id}`,
    delete: (id: string | number) => `/api/v1/asset/delete/${id}`,
  },
  assetType: {
    list: "/api/v1/asset-type/list",
    create: "/api/v1/asset-type/create",
    update: (id: string | number) => `/api/v1/asset-type/update/${id}`,
    delete: (id: string | number) => `/api/v1/asset-type/delete/${id}`,
  },
  employeeAsset: {
    list: "/api/v1/employee-asset/list",
    create: "/api/v1/employee-asset/create",
    update: (id: string | number) => `/api/v1/employee-asset/update/${id}`,
    delete: (id: string | number) => `/api/v1/employee-asset/delete/${id}`,
  },
  employeeServiceHistory: {
    list: "/api/v1/employee-service-history/list",
    create: "/api/v1/employee-service-history/create",
    update: (id: string | number) => `/api/v1/employee-service-history/update/${id}`,
    delete: (id: string | number) => `/api/v1/employee-service-history/delete/${id}`,
  },
  device: {
    list: "/api/v1/device/list",
    get: (id: string | number) =>
      `/api/v1/device/list?device_id=${encodeURIComponent(String(id))}`,
    create: "/api/v1/device/create",
    update: (id: string | number) => `/api/v1/device/update/${id}`,
    delete: (id: string | number) => `/api/v1/device/delete/${id}`,
    sync: "/api/v1/device/sync",
  },
  applOptions: {
    list: "/api/v1/appl-options/list",
    gender: "/api/v1/appl-options/gender",
    bloodGroup: "/api/v1/appl-options/blood-group",
    maritalStatus: "/api/v1/appl-options/marital-status",
  },
  auditLog: {
    create: "/api/v1/audit-log/create",
  },
  auth: {
    login: "/api/v1/auth/login",
    register: "/api/v1/auth/register",
    logout: "/api/v1/auth/logout",
    me: "/api/v1/auth/me",
    forgotPassword: "/api/v1/auth/forgot-password",
    verifyOtp: "/api/v1/auth/verify-otp",
    resetPassword: "/api/v1/auth/reset-password",
    refreshToken: "/api/v1/auth/refresh",
  },
  menu: {
    list: "/api/v1/menu/list",
    tree: "/api/v1/menu/tree",
    get: (id: string | number) => `/api/v1/menu/get/${id}`,
    getByMenu: (menuId: string | number, subMenuId?: string | number) =>
      subMenuId === undefined
        ? `/api/v1/menu/get-by-menu/${menuId}`
        : `/api/v1/menu/get-by-menu/${menuId}/${subMenuId}`,
  },
  dashboard: {
    analytics: "/dashboard/analytics",
    sales: "/dashboard/sales",
    attendance: "/dashboard/attendance",
    performance: "/dashboard/performance",
  },
  employee: {
    list: "/api/v1/employee/list",
    create: "/api/v1/employee/create",
    update: (id: number | string) => `/api/v1/employee/update/${id}`,
    remove: (id: number | string) => `/api/v1/employee/delete/${id}`,
  },
  attendance: {
    list: "/api/v1/attendance/list",
    daily: "/api/v1/attendance/daily",
    create: "/api/v1/attendance/create",
    update: (id: string | number) => `/api/v1/attendance/update/${id}`,
    delete: (id: string | number) => `/api/v1/attendance/delete/${id}`,
    punchList: "/api/v1/attendance/punch/list",
    punchCreate: "/api/v1/attendance/punch/create",
  },
  clients: {
    leads: "/clients/leads",
    customers: "/clients/customers",
    companies: "/clients/companies",
    opportunities: "/clients/opportunities",
    activityLog: "/clients/activity-log",
    notes: "/clients/notes",
  },
  projects: {
    tasks: "/projects/tasks",
    overview: "/projects/overview",
    deadlines: "/projects/deadlines",
    milestones: "/projects/milestones",
    reports: "/projects/reports",
  },
  payroll: {
    salaries: "/payroll/salaries",
    invoices: "/payroll/invoices",
    expenses: "/payroll/expenses",
  },
  reports: {
    employeePerformance: "/reports/employee-performance",
    customerEngagement: "/reports/customer-engagement",
    kpi: "/reports/kpi",
  },
  apps: {
    chat: "/apps/chat",
    email: "/apps/email",
    calendar: "/apps/calendar",
    teams: "/apps/teams",
  },
  codeSeries: {
    modules: "/api/v1/code-series/modules",
    list: (module?: string) =>
      module ? `/api/v1/code-series/list?module=${encodeURIComponent(module)}` : "/api/v1/code-series/list",
    update: "/api/v1/code-series/update",
  },
} as const;
