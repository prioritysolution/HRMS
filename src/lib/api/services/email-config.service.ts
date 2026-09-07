import { apiClient, isSoftApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ApiMessageResponse,
  EmailConfigRecord,
  EmailConfigTestPayload,
  EmailConfigWritePayload,
} from "@/lib/api/types";

const SOFT_REQUEST = { throwOnError: false } as const;

export type EmailConfigActionResult<T> = {
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

function isMaskedPassword(value: string): boolean {
  return /^\*+$|^•+$|^x+$/i.test(value);
}

function isMissingRoute(status: number, message: string, payload?: unknown): boolean {
  if (status === 404 || status === 405) return true;
  const exception = asText(asRecord(payload)?.exception);
  return /could not be found/i.test(message) || exception.includes("NotFoundHttpException");
}

function toUserMessage(status: number, message: string, action: "load" | "save" | "test"): string {
  if (isMissingRoute(status, message)) {
    if (action === "load") {
      return "Could not load saved SMTP settings. The email configuration API is not available yet.";
    }
    if (action === "save") {
      return "Could not save SMTP settings. The email configuration API is not available yet.";
    }
    return "Could not send test email. The email configuration API is not available yet.";
  }

  if (status === 408 || /timed out/i.test(message)) {
    return "Request timed out. Please try again.";
  }

  if (status === 0 || /network error/i.test(message)) {
    return "Network error. Check your API connection.";
  }

  return message || "Something went wrong. Please try again.";
}

function fail<T>(action: "load" | "save" | "test", status: number, message: string, payload?: unknown): EmailConfigActionResult<T> {
  return {
    ok: false,
    message: toUserMessage(status, message, action),
    missingRoute: isMissingRoute(status, message, payload),
  };
}

function emptyConfig(): EmailConfigRecord {
  return asEmailConfig({});
}

function asEmailConfig(payload: unknown): EmailConfigRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  const source = nested ?? record ?? {};

  const password = asText(
    readValue(source, ["password", "Password", "mail_password", "MAIL_PASSWORD"]),
  );

  return {
    mailer: asText(readValue(source, ["mailer", "Mailer", "mail_mailer", "MAIL_MAILER"])) || "smtp",
    host: asText(readValue(source, ["host", "Host", "mail_host", "MAIL_HOST"])),
    port: asText(readValue(source, ["port", "Port", "mail_port", "MAIL_PORT"])) || "465",
    username: asText(readValue(source, ["username", "Username", "mail_username", "MAIL_USERNAME"])),
    password: password && !isMaskedPassword(password) ? password : "",
    encryption:
      asText(readValue(source, ["encryption", "Encryption", "mail_encryption", "MAIL_ENCRYPTION"])) ||
      "tls",
    from_address: asText(
      readValue(source, [
        "from_address",
        "From_address",
        "fromAddress",
        "mail_from_address",
        "MAIL_FROM_ADDRESS",
      ]),
    ),
    from_name: asText(
      readValue(source, ["from_name", "From_name", "fromName", "mail_from_name", "MAIL_FROM_NAME"]),
    ),
  };
}

export const emailConfigService = {
  get: async (): Promise<EmailConfigActionResult<EmailConfigRecord>> => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.emailConfig.get, SOFT_REQUEST);
    if (isSoftApiError(payload)) {
      return {
        ...fail("load", payload.status, payload.message, payload.data),
        data: emptyConfig(),
      };
    }
    if (payload === undefined) {
      return fail("load", 401, "Your session expired. Please sign in again.");
    }
    return {
      ok: true,
      data: asEmailConfig(payload),
      message: "SMTP configuration loaded.",
    };
  },

  update: async (
    data: EmailConfigWritePayload,
  ): Promise<EmailConfigActionResult<EmailConfigRecord>> => {
    const payload = await apiClient.put<unknown>(API_ENDPOINTS.emailConfig.update, data, SOFT_REQUEST);
    if (isSoftApiError(payload)) {
      return fail("save", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return fail("save", 401, "Your session expired. Please sign in again.");
    }
    return {
      ok: true,
      data: asEmailConfig(payload),
      message: "SMTP configuration saved.",
    };
  },

  test: async (
    data: EmailConfigTestPayload,
  ): Promise<EmailConfigActionResult<ApiMessageResponse>> => {
    const payload = await apiClient.post<unknown>(API_ENDPOINTS.emailConfig.test, data, SOFT_REQUEST);
    if (isSoftApiError(payload)) {
      return fail("test", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return fail("test", 401, "Your session expired. Please sign in again.");
    }
    const record = asRecord(payload);
    return {
      ok: true,
      data: { message: asText(record?.message) || "Test email sent successfully." },
      message: asText(record?.message) || "Test email sent successfully.",
    };
  },
};
