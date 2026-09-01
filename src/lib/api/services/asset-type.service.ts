import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { HrmsRow } from "@/types/hrms";

export const assetTypeService = {
  list: async () => {
    const response = await apiClient.get<Array<{ Type_id: number; Type_name: string }>>(
      API_ENDPOINTS.assetType.list
    );

    const data = Array.isArray(response) ? response : [];

    return data.map((type) => ({
      id: String(type.Type_id),
      Type_id: type.Type_id,
      Type_name: type.Type_name,
    })) as unknown as HrmsRow[];
  },

  create: async (row: HrmsRow) => {
    const payload = {
      type_name: String(row.Type_name ?? "").trim(),
    };
    const response = await apiClient.post<Record<string, unknown>>(
      API_ENDPOINTS.assetType.create,
      payload
    );
    return {
      ...row,
      ...response,
      id: String(response?.Type_id ?? row.id),
      Type_id: response?.Type_id ?? row.Type_id,
    } as HrmsRow;
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = {
      type_name: String(row.Type_name ?? "").trim(),
    };
    const response = await apiClient.put<Record<string, unknown>>(
      API_ENDPOINTS.assetType.update(id),
      payload
    );
    return {
      ...row,
      ...response,
      id: String(id),
      Type_id: Number(id),
    } as HrmsRow;
  },

  remove: async (id: string | number) => {
    return apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.assetType.delete(id),
      { unwrap: false }
    );
  },
};
