import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  EmployeeCreatePayload,
  EmployeeDetail,
  EmployeeRecord,
  EmployeeUpdatePayload,
} from "@/lib/api/types";

interface EmployeeListParams {
  status?: number;
  employee_code?: string;
  employee_id?: number | string;
  with_details?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

function buildQuery(params?: EmployeeListParams): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.status !== undefined) {
    searchParams.set("status", String(params.status));
  }

  if (params.employee_code) {
    searchParams.set("employee_code", params.employee_code);
  }

  if (params.employee_id !== undefined) {
    searchParams.set("employee_id", String(params.employee_id));
  }

  if (params.with_details !== undefined) {
    searchParams.set("with_details", String(params.with_details));
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const employeeService = {
  list: async (
    params?: EmployeeListParams,
  ): Promise<EmployeeRecord[]> => {
    const response = await apiClient.get<
      ApiResponse<EmployeeRecord[]>
    >(
      `${API_ENDPOINTS.employee.list}${buildQuery(params)}`,
    );

    return response.data ?? [];
  },

  getDetails: async (
    employeeId: string | number,
  ): Promise<EmployeeDetail | null> => {
    const response = await apiClient.get<
      ApiResponse<EmployeeDetail>
    >(
      `${API_ENDPOINTS.employee.list}?employee_id=${employeeId}&with_details=1`,
    );

    return response.data ?? null;
  },

  create: async (
    payload: EmployeeCreatePayload,
  ): Promise<EmployeeRecord> => {
    const response = await apiClient.post<
      ApiResponse<EmployeeRecord>
    >(
      API_ENDPOINTS.employee.create,
      payload,
    );

    return response.data;
  },

  update: async (
    id: string | number,
    payload: EmployeeUpdatePayload,
  ): Promise<EmployeeRecord> => {
    const response = await apiClient.put<
      ApiResponse<EmployeeRecord>
    >(
      API_ENDPOINTS.employee.update(id),
      payload,
    );

    return response.data;
  },

  remove: async (
    id: string | number,
  ): Promise<void> => {
    await apiClient.delete(
      API_ENDPOINTS.employee.remove(id),
    );
  },
};