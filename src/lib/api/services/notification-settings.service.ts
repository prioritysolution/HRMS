import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  NotificationSettingsRecord,
  NotificationSettingsWritePayload,
} from "@/lib/api/types";

export type NotificationSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function readFirstDataRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const rec = value as Record<string, unknown>;
  const rawData = "data" in rec ? rec.data : value;
  if (!rawData || typeof rawData !== "object") return undefined;
  const data = Array.isArray(rawData) ? rawData[0] : rawData;
  if (!data || typeof data !== "object") return undefined;
  return data as Record<string, unknown>;
}

function asNotificationSettingsRecord(value: unknown): NotificationSettingsRecord | undefined {
  const rec = readFirstDataRecord(value);
  if (!rec) return undefined;

  const inApp = Number(rec.In_App ?? rec.in_app ?? rec.inapp_notification) === 1 ? 1 : 0;
  const email = Number(rec.Email ?? rec.email ?? rec.email_notification) === 1 ? 1 : 0;
  const sms = Number(rec.Sms ?? rec.sms ?? rec.sms_notification) === 1 ? 1 : 0;
  const push = Number(rec.Push ?? rec.push ?? rec.push_notification) === 1 ? 1 : 0;
  const whatsapp = Number(rec.Whatsapp ?? rec.whatsapp ?? rec.whatsapp_notification) === 1 ? 1 : 0;

  return {
    setting_id: Number(rec.Setting_Id ?? rec.setting_id) || undefined,
    inapp_notification: inApp,
    email_notification: email,
    sms_notification: sms,
    push_notification: push,
    whatsapp_notification: whatsapp,
    in_app: inApp,
    email: email,
    sms: sms,
    push: push,
    whatsapp: whatsapp,
  };
}

export const notificationSettingsService = {
  get: async (): Promise<NotificationSettingsActionResult<NotificationSettingsRecord>> => {
    try {
      const res = await apiClient.get<unknown>(API_ENDPOINTS.notificationSettings.list);
      const data = asNotificationSettingsRecord(res);
      if (!data) {
        throw new Error("Invalid response format");
      }
      return {
        ok: true,
        data,
        message: "Notification settings retrieved successfully.",
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to load notification settings",
      };
    }
  },

  update: async (
    data: Partial<NotificationSettingsWritePayload> & Partial<NotificationSettingsRecord>,
  ): Promise<NotificationSettingsActionResult<NotificationSettingsRecord>> => {
    try {
      const payload: NotificationSettingsWritePayload = {
        in_app: data.in_app ?? (data.inapp_notification ? 1 : 0),
        email: data.email ?? (data.email_notification ? 1 : 0),
        sms: data.sms ?? (data.sms_notification ? 1 : 0),
        push: data.push ?? (data.push_notification ? 1 : 0),
        whatsapp: data.whatsapp ?? (data.whatsapp_notification ? 1 : 0),
      };

      const res = await apiClient.put<unknown>(
        API_ENDPOINTS.notificationSettings.save,
        payload,
      );

      const updated = asNotificationSettingsRecord(res);
      return {
        ok: true,
        data: updated ?? {
          inapp_notification: payload.in_app,
          email_notification: payload.email,
          sms_notification: payload.sms,
          push_notification: payload.push,
          whatsapp_notification: payload.whatsapp,
          ...payload,
        },
        message: "Notification settings saved successfully.",
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to save notification settings",
      };
    }
  },
};
