import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ListQuery, PaginatedResponse } from "@/lib/api/types";

export type EmployeeRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  type: string;
  joinDate: string;
  avatar?: string;
};

export const employeesService = {
  list: (query?: ListQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.search) params.set("search", query.search);
    if (query?.sortBy) params.set("sortBy", query.sortBy);
    if (query?.sortOrder) params.set("sortOrder", query.sortOrder);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<PaginatedResponse<EmployeeRecord>>(
      `${API_ENDPOINTS.employees.list}${suffix}`,
    );
  },

  getById: (id: string) => apiClient.get<EmployeeRecord>(API_ENDPOINTS.employees.detail(id)),

  create: (payload: Partial<EmployeeRecord>) =>
    apiClient.post<EmployeeRecord>(API_ENDPOINTS.employees.create, payload),

  update: (id: string, payload: Partial<EmployeeRecord>) =>
    apiClient.put<EmployeeRecord>(API_ENDPOINTS.employees.update(id), payload),

  remove: (id: string) => apiClient.delete<{ message: string }>(API_ENDPOINTS.employees.delete(id)),

  attendance: (query?: ListQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.search) params.set("search", query.search);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      `${API_ENDPOINTS.employees.attendance}${suffix}`,
    );
  },

  leaves: (query?: ListQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.search) params.set("search", query.search);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      `${API_ENDPOINTS.employees.leaves}${suffix}`,
    );
  },

  onboarding: (query?: ListQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<PaginatedResponse<Record<string, unknown>>>(
      `${API_ENDPOINTS.employees.onboarding}${suffix}`,
    );
  },
};
