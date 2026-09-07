import { apiClient, isSoftApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  NotificationChannelStatus,
  NotificationSettingsRecord,
  NotificationSettingsWritePayload,
} from "@/lib/api/types";

const SOFT_REQUEST = { throwOnError: false } as const;

export type NotificationSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  missingRoute?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function asText(value: unknown): string {
  if (value === undefined || value === null || value === false) return "";
  return String(value).trim();
}

function toChannelStatus(value: unknown): NotificationChannelStatus {
  if (value === 0 || value === "0" || value === false) return 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "inactive" || normalized === "0" || normalized === "false") return 0;
  }
  return 1;
}

function isMissingRoute(status: number, message: string, payload?: unknown): boolean {
  if (status === 404 || status === 405) return true;
  const exception = asText(asRecord(payload)?.exception);
  return /could not be found/i.test(message) || exception.includes("NotFoundHttpException");
}

function toUserMessage(status: number, message: string, action: "load" | "save"): string {
  if (isMissingRoute(status, message)) {
    if (action === "load") {
      return "Could not load notification settings. The notifications API is not available yet.";
    }
    return "Could not save notification settings. The notifications API is not available yet.";
  }

  if (status === 408 || /timed out/i.test(message)) {
    return "Request timed out. Please try again.";
  }

  if (status === 0 || /network error/i.test(message)) {
    return "Network error. Check your API connection.";
  }

  return message || "Something went wrong. Please try again.";
}

function fail<T>(
  action: "load" | "save",
  status: number,
  message: string,
  payload?: unknown,
): NotificationSettingsActionResult<T> {
  return {
    ok: false,
    message: toUserMessage(status, message, action),
    missingRoute: isMissingRoute(status, message, payload),
  };
}

function asNotificationSettings(payload: unknown): NotificationSettingsRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  const source = nested ?? record ?? {};

  return {
    email_notification: toChannelStatus(
      readValue(source, [
        "email_notification",
        "Email_notification",
        "emailNotification",
        "email",
      ]),
    ),
    inapp_notification: toChannelStatus(
      readValue(source, [
        "inapp_notification",
        "Inapp_notification",
        "inappNotification",
        "in_app_notification",
        "inapp",
      ]),
    ),
  };
}

function emptySettings(): NotificationSettingsRecord {
  return { email_notification: 1, inapp_notification: 1 };
}

export const notificationSettingsService = {
  get: async (): Promise<NotificationSettingsActionResult<NotificationSettingsRecord>> => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.notificationSettings.get, SOFT_REQUEST);
    if (isSoftApiError(payload)) {
      return {
        ...fail("load", payload.status, payload.message, payload.data),
        data: emptySettings(),
      };
    }
    if (payload === undefined) {
      return fail("load", 401, "Your session expired. Please sign in again.");
    }
    return {
      ok: true,
      data: asNotificationSettings(payload),
      message: "Notification settings loaded.",
    };
  },

  update: async (
    data: NotificationSettingsWritePayload,
  ): Promise<NotificationSettingsActionResult<NotificationSettingsRecord>> => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.notificationSettings.update,
      data,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return fail("save", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return fail("save", 401, "Your session expired. Please sign in again.");
    }
    return {
      ok: true,
      data: asNotificationSettings(payload),
      message: "Notification settings saved.",
    };
  },
};
