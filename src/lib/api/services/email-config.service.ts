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
  /** True when API returned an empty list (first-time setup). */
  empty?: boolean;
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

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/** API returns masked secrets like ******** — never put those in the form. */
function isMaskedPassword(value: string): boolean {
  if (!value) return false;
  return /^\*+$|^•+$|^x+$/i.test(value) || /^[*•x]{4,}$/i.test(value);
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

function fail<T>(
  action: "load" | "save" | "test",
  status: number,
  message: string,
  payload?: unknown,
): EmailConfigActionResult<T> {
  return {
    ok: false,
    message: toUserMessage(status, message, action),
    missingRoute: isMissingRoute(status, message, payload),
  };
}

function emptyConfig(): EmailConfigRecord {
  return {
    config_id: null,
    mailer: "smtp",
    host: "",
    port: "587",
    username: "",
    password: "",
    encryption: "tls",
    from_address: "",
    from_name: "",
  };
}

/** Prefer first list row from GET /email-config/list envelope. */
function pickConfigSource(payload: unknown): Record<string, unknown> {
  if (Array.isArray(payload)) {
    return asRecord(payload[0]) ?? {};
  }

  const record = asRecord(payload);
  if (!record) return {};

  const data = record.data;
  if (Array.isArray(data)) {
    return asRecord(data[0]) ?? {};
  }

  const nested = asRecord(data);
  if (nested) {
    if (Array.isArray(nested.data)) {
      return asRecord(nested.data[0]) ?? {};
    }
    return nested;
  }

  return record;
}

export function asEmailConfig(payload: unknown): EmailConfigRecord {
  const source = pickConfigSource(payload);

  const passwordRaw = asText(
    readValue(source, [
      "Config_Password",
      "config_password",
      "password",
      "Password",
      "mail_password",
      "MAIL_PASSWORD",
    ]),
  );

  return {
    config_id: optionalNumber(
      readValue(source, ["Config_Id", "config_id", "id"]),
    ),
    mailer:
      asText(readValue(source, ["mailer", "Mailer", "mail_mailer", "MAIL_MAILER"])) || "smtp",
    host: asText(
      readValue(source, [
        "Config_Host",
        "config_host",
        "host",
        "Host",
        "mail_host",
        "MAIL_HOST",
      ]),
    ),
    port:
      asText(
        readValue(source, [
          "Config_Port",
          "config_port",
          "port",
          "Port",
          "mail_port",
          "MAIL_PORT",
        ]),
      ) || "587",
    username: asText(
      readValue(source, [
        "Config_Username",
        "config_username",
        "username",
        "Username",
        "mail_username",
        "MAIL_USERNAME",
      ]),
    ),
    // Never show API-masked password (********) in the input
    password: passwordRaw && !isMaskedPassword(passwordRaw) ? passwordRaw : "",
    encryption:
      asText(
        readValue(source, [
          "Config_Encryption",
          "config_encryption",
          "encryption",
          "Encryption",
          "mail_encryption",
          "MAIL_ENCRYPTION",
        ]),
      ) || "tls",
    from_address: asText(
      readValue(source, [
        "Config_From_Email",
        "config_from_email",
        "from_address",
        "From_address",
        "fromAddress",
        "mail_from_address",
        "MAIL_FROM_ADDRESS",
      ]),
    ),
    from_name: asText(
      readValue(source, [
        "Config_From_Name",
        "config_from_name",
        "from_name",
        "From_name",
        "fromName",
        "mail_from_name",
        "MAIL_FROM_NAME",
      ]),
    ),
  };
}

/** Map UI SMTP fields → PUT /email-config/update body. */
export function toEmailConfigWritePayload(input: {
  host: string;
  port: number | string;
  username: string;
  password: string;
  encryption: string;
  from_address: string;
  from_name: string;
}): EmailConfigWritePayload {
  return {
    config_host: asText(input.host),
    config_port: asText(input.port) || "587",
    config_username: asText(input.username),
    config_password: String(input.password ?? ""),
    config_encryption: asText(input.encryption) || "tls",
    config_from_email: asText(input.from_address),
    config_from_name: asText(input.from_name),
  };
}

export const emailConfigService = {
  /**
   * GET /api/v1/email-config/list
   * Returns the single config row (or empty defaults for first-time setup).
   */
  get: async (): Promise<EmailConfigActionResult<EmailConfigRecord>> => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.emailConfig.list, SOFT_REQUEST);
    if (isSoftApiError(payload)) {
      return {
        ...fail("load", payload.status, payload.message, payload.data),
        data: emptyConfig(),
      };
    }
    if (payload === undefined) {
      return fail("load", 401, "Your session expired. Please sign in again.");
    }

    const source = pickConfigSource(payload);
    const empty = Object.keys(source).length === 0;

    return {
      ok: true,
      data: empty ? emptyConfig() : asEmailConfig(payload),
      empty,
      message: empty
        ? "No email configuration saved yet."
        : asText(asRecord(payload)?.message) || "SMTP configuration loaded.",
    };
  },

  update: async (
    data: EmailConfigWritePayload,
  ): Promise<EmailConfigActionResult<EmailConfigRecord>> => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.emailConfig.update,
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
      data: asEmailConfig(payload),
      message: asText(asRecord(payload)?.message) || "SMTP configuration saved.",
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
