import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { LeaveSettingsRecord, LeaveSettingsWritePayload } from "@/lib/api/types";

export type LeaveSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function asLeaveSettingsRecord(value: unknown): LeaveSettingsRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  
  const hasDataKey = "data" in (value as Record<string, unknown>);
  const rawData = hasDataKey ? (value as Record<string, unknown>).data : value;
  
  if (!rawData || typeof rawData !== "object") return undefined;
  
  const data = Array.isArray(rawData) ? rawData[0] : rawData;
  if (!data) return undefined;

  return {
    setting_id: Number(data.Setting_Id ?? data.setting_id) || undefined,
    apply_future_leave: Number(data.Apply_Future_Leave ?? data.apply_future_leave) ? 1 : 0,
    apply_previous_leave: Number(data.Apply_Previous_Leave ?? data.apply_previous_leave) ? 1 : 0,
    half_day_allowed: Number(data.Half_Day_Allowed ?? data.half_day_allowed) ? 1 : 0,
    apply_during_probation: Number(data.Apply_During_Probation ?? data.apply_during_probation) ? 1 : 0,
    reason_mandatory: Number(data.Reason_Mandatory ?? data.reason_mandatory) ? 1 : 0,
    prevent_overlapping_leave: Number(data.Prevent_Overlapping_Leave ?? data.prevent_overlapping_leave) ? 1 : 0,
  } as LeaveSettingsRecord;
}

export const leaveSettingsService = {
  get: async (): Promise<LeaveSettingsActionResult<LeaveSettingsRecord>> => {
    try {
      const payload = await apiClient.get<unknown>(API_ENDPOINTS.leaveSettings.list);
      const data = asLeaveSettingsRecord(payload);
      if (!data) throw new Error("Invalid response format");
      return { ok: true, data, message: "Leave settings loaded." };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to load leave settings",
      };
    }
  },

  update: async (
    payload: LeaveSettingsWritePayload,
  ): Promise<LeaveSettingsActionResult<LeaveSettingsRecord>> => {
    try {
      const response = await apiClient.put<unknown>(API_ENDPOINTS.leaveSettings.save, payload);
      const data = asLeaveSettingsRecord(response);
      return {
        ok: true,
        data,
        message:
          response && typeof response === "object" && "message" in response
            ? String(response.message)
            : "Leave settings saved.",
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to save leave settings",
      };
    }
  },
};

