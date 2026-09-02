import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type CodeSeriesModule = {
  module: string;
  module_name: string;
};

export type CodeSeriesConfig = {
  Series_id?: number;
  Module_key: string;
  Module_name: string;
  Prefix: string;
  Next_counter: number;
  Padding_digits: number;
  Suffix: string;
  Status: number;
  formatted_sample?: string;
  Updated_by?: number | null;
  Created_at?: string;
  Updated_at?: string;
};

export type CodeSeriesWritePayload = {
  module: string;
  module_name: string;
  prefix: string;
  next_counter: number;
  padding_digits: number;
  suffix: string;
  status: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export const codeSeriesService = {
  modules: async (): Promise<CodeSeriesModule[]> => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.codeSeries.modules);
    const record = asRecord(payload);
    if (record && Array.isArray(record.data)) {
      return record.data as CodeSeriesModule[];
    }
    return Array.isArray(payload) ? payload as CodeSeriesModule[] : [];
  },

  list: async (module?: string): Promise<CodeSeriesConfig[]> => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.codeSeries.list(module));
    const record = asRecord(payload);
    if (record && Array.isArray(record.data)) {
      return record.data as CodeSeriesConfig[];
    }
    return Array.isArray(payload) ? payload as CodeSeriesConfig[] : [];
  },

  update: async (data: CodeSeriesWritePayload): Promise<CodeSeriesConfig> => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.codeSeries.update,
      data,
    );
    const record = asRecord(payload);
    if (record && record.data) {
      return record.data as CodeSeriesConfig;
    }
    return payload as CodeSeriesConfig;
  },
};
