import {
  MOCK_NOTIFICATION_SETTINGS,
  type NotificationChannelSettings,
} from "@/data/settings-mock";
import type {
  NotificationSettingsRecord,
  NotificationSettingsWritePayload,
} from "@/lib/api/types";

export type NotificationSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  missingRoute?: boolean;
};

function cloneSettings(source: NotificationChannelSettings): NotificationSettingsRecord {
  return { ...source };
}

/** In-memory demo store until Notification Settings API supports all channels. */
let settingsStore = cloneSettings(MOCK_NOTIFICATION_SETTINGS);

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFlag(value: unknown): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

export const notificationSettingsService = {
  get: async (): Promise<NotificationSettingsActionResult<NotificationSettingsRecord>> => {
    await delay();
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Notification settings loaded (demo).",
    };
  },

  update: async (
    data: NotificationSettingsWritePayload,
  ): Promise<NotificationSettingsActionResult<NotificationSettingsRecord>> => {
    await delay();
    settingsStore = cloneSettings({
      inapp_notification: toFlag(data.inapp_notification),
      email_notification: toFlag(data.email_notification),
      sms_notification: toFlag(data.sms_notification),
      push_notification: toFlag(data.push_notification),
      whatsapp_notification: toFlag(data.whatsapp_notification),
    });
    return {
      ok: true,
      data: cloneSettings(settingsStore),
      message: "Notification settings saved (demo).",
    };
  },
};
