export { applOptionService, applOptionsToSelectOptions } from "@/lib/api/services/appl-options.service";
export { auditLogService } from "@/lib/api/services/audit-log.service";
export { authService } from "@/lib/api/services/auth.service";
export { menuService } from "@/lib/api/services/menu.service";
export { branchService } from "@/lib/api/services/branch.service";
export { assetService } from "@/lib/api/services/asset.service";
export { employeeAssetService } from "@/lib/api/services/employee-asset.service";
export { employeeServiceHistoryService } from "@/lib/api/services/employee-service-history.service";
export { departmentService } from "@/lib/api/services/department.service";
export { designationService } from "@/lib/api/services/designation.service";
export { gradeService } from "@/lib/api/services/grade.service";
export { gradeSalaryService } from "@/lib/api/services/grade-salary.service";
export { workShiftService } from "@/lib/api/services/work-shift.service";
export { employeeService } from "@/lib/api/services/employee.service";
export { employmentTypeService } from "@/lib/api/services/employment-type.service";
export { employmentStatusService } from "@/lib/api/services/employment-status.service";
export { organizationService } from "@/lib/api/services/organization.service";
export { holidayService } from "@/lib/api/services/holiday.service";
export {
  attendanceToRow,
  punchToRow,
  rowToAttendancePayload,
  rowToPunchPayload,
  toFormRow,
} from "@/lib/api/services/attendance.service";
export { attendanceService } from "@/lib/api/services/attendance.service";
export { codeSeriesService } from "@/lib/api/services/code-series.service";
export { employeeOnboardingService } from "@/lib/api/services/employee-onboarding.service";
export {
  attendanceTrendToPercentages,
  dashboardService,
} from "@/lib/api/services/dashboard.service";

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ListQuery, PaginatedResponse } from "@/lib/api/types";

function withQuery(basePath: string, query?: ListQuery) {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.search) params.set("search", query.search);
  if (query?.sortBy) params.set("sortBy", query.sortBy);
  if (query?.sortOrder) params.set("sortOrder", query.sortOrder);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return `${basePath}${suffix}`;
}

export const clientsService = {
  leads: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.clients.leads, query),
    ),
  customers: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.clients.customers, query),
    ),
  companies: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.clients.companies, query),
    ),
  opportunities: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.clients.opportunities, query),
    ),
  activityLog: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.clients.activityLog, query),
    ),
  notes: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.clients.notes, query),
    ),
};

export const projectsService = {
  tasks: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.projects.tasks, query),
    ),
  overview: () => apiClient.get<Record<string, unknown>>(API_ENDPOINTS.projects.overview),
  deadlines: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.projects.deadlines, query),
    ),
  milestones: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.projects.milestones, query),
    ),
  reports: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.projects.reports, query),
    ),
};

export const payrollService = {
  salaries: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.payroll.salaries, query),
    ),
  invoices: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.payroll.invoices, query),
    ),
  expenses: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.payroll.expenses, query),
    ),
};

export const reportsService = {
  employeePerformance: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.reports.employeePerformance, query),
    ),
  customerEngagement: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.reports.customerEngagement, query),
    ),
  kpi: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.reports.kpi, query),
    ),
};

export const appsService = {
  chat: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.apps.chat, query),
    ),
  email: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.apps.email, query),
    ),
  calendar: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.apps.calendar, query),
    ),
  teams: (query?: ListQuery) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      withQuery(API_ENDPOINTS.apps.teams, query),
    ),
};
