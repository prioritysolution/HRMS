import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApplOptionListQuery, ApplOptionRecord } from "@/lib/api/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asApplOptionList(payload: unknown): ApplOptionRecord[] {
  if (Array.isArray(payload)) return payload as ApplOptionRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as ApplOptionRecord[];
  return [];
}

function withListQuery(basePath: string, query?: ApplOptionListQuery) {
  const params = new URLSearchParams();
  if (query?.opt_grp_id !== undefined) params.set("opt_grp_id", String(query.opt_grp_id));
  if (query?.is_active !== undefined) params.set("is_active", String(query.is_active));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function applOptionsToSelectOptions(records: ApplOptionRecord[]) {
  return [...records]
    .sort((left, right) => Number(left.Srl_No ?? 0) - Number(right.Srl_No ?? 0))
    .map((record) => ({
      value: String(record.Opt_Code),
      label: String(record.Opt_Description),
    }));
}

export const OPT_GRP_IDS = {
  MESSAGE_TYPE: 20,
  WORKING_DAYS_BASIS: 21,
  SALARY_CALCULATION_BASED_ON: 22,
  OT_CALCULATION: 23,
  SALARY_SLIP_FORMAT: 24,
  SALARY_BASIS: 25,
  TAX_REGIME: 26,
  TDS_CALCULATION_METHOD: 27,
  PT_BASED_ON: 28,
  DEDUCTION_FREQUENCY: 29,
} as const;

export const applOptionService = {
  list: async (query?: ApplOptionListQuery) => {
    const payload = await apiClient.get<unknown>(withListQuery(API_ENDPOINTS.applOptions.list, query));
    return asApplOptionList(payload);
  },

  gender: async (isActive: 0 | 1 = 1) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.applOptions.gender, { is_active: isActive }),
    );
    return asApplOptionList(payload);
  },

  bloodGroup: async (isActive: 0 | 1 = 1) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.applOptions.bloodGroup, { is_active: isActive }),
    );
    return asApplOptionList(payload);
  },

  maritalStatus: async (isActive: 0 | 1 = 1) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.applOptions.maritalStatus, { is_active: isActive }),
    );
    return asApplOptionList(payload);
  },
};

