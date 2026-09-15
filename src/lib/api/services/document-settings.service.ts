import { apiClient, isSoftApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  DocumentSettingsRecord,
  DocumentSettingsWritePayload,
} from "@/lib/api/types";

const SOFT_REQUEST = { throwOnError: false } as const;

export type DocumentSettings = DocumentSettingsRecord;

export type DocumentSettingsActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  empty?: boolean;
  missingRoute?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickFirst(payload: unknown): Record<string, unknown> {
  if (Array.isArray(payload)) return asRecord(payload[0]) ?? {};
  const record = asRecord(payload);
  if (!record) return {};
  if (Array.isArray(record.data)) return asRecord(record.data[0]) ?? {};
  const nested = asRecord(record.data);
  if (nested) {
    if (Array.isArray(nested.data)) return asRecord(nested.data[0]) ?? {};
    return nested;
  }
  return record;
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

function toFlag(value: unknown, fallback: 0 | 1 = 0): 0 | 1 {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).trim() === "0" ? 0 : 1;
}

function isMissingRoute(status: number, message: string, payload?: unknown): boolean {
  if (status === 404 || status === 405) return true;
  const exception = asText(asRecord(payload)?.exception);
  return /could not be found/i.test(message) || exception.includes("NotFoundHttpException");
}

function toUserMessage(
  status: number,
  message: string,
  action: "load" | "save",
): string {
  if (isMissingRoute(status, message)) {
    return action === "load"
      ? "Could not load document settings. The document settings API is not available yet."
      : "Could not save document settings. The document settings API is not available yet.";
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
): DocumentSettingsActionResult<T> {
  return {
    ok: false,
    message: toUserMessage(status, message, action),
    missingRoute: isMissingRoute(status, message, payload),
  };
}

function emptySettings(): DocumentSettings {
  return {
    setting_id: null,
    approval_required: 1,
    allow_edit_after_approval: 0,
    allow_cancel_after_approval: 0,
    allow_reprint: 1,
    show_duplicate_on_reprint: 1,
  };
}

export function asDocumentSettings(payload: unknown): DocumentSettings {
  const source = pickFirst(payload);
  if (Object.keys(source).length === 0) return emptySettings();

  return {
    setting_id: optionalNumber(
      readValue(source, ["Setting_Id", "setting_id", "id"]),
    ),
    approval_required: toFlag(
      readValue(source, ["Approval_Required", "approval_required"]),
      1,
    ),
    allow_edit_after_approval: toFlag(
      readValue(source, ["Allow_Edit_After_Approval", "allow_edit_after_approval"]),
      0,
    ),
    allow_cancel_after_approval: toFlag(
      readValue(source, [
        "Allow_Cancel_After_Approval",
        "allow_cancel_after_approval",
      ]),
      0,
    ),
    allow_reprint: toFlag(
      readValue(source, ["Allow_Reprint", "allow_reprint"]),
      1,
    ),
    show_duplicate_on_reprint: toFlag(
      readValue(source, [
        "Show_Duplicate_On_Reprint",
        "show_duplicate_on_reprint",
      ]),
      1,
    ),
  };
}

function envelopeMessage(payload: unknown, fallback: string): string {
  return asText(asRecord(payload)?.message) || fallback;
}

export const documentSettingsService = {
  get: async (): Promise<DocumentSettingsActionResult<DocumentSettings>> => {
    const payload = await apiClient.get<unknown>(
      API_ENDPOINTS.documentSettings.list,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return {
        ...fail("load", payload.status, payload.message, payload.data),
        data: emptySettings(),
      };
    }
    if (payload === undefined) {
      return fail("load", 401, "Your session expired. Please sign in again.");
    }

    const source = pickFirst(payload);
    const empty = Object.keys(source).length === 0;
    return {
      ok: true,
      data: empty ? emptySettings() : asDocumentSettings(payload),
      empty,
      message: empty
        ? "No document settings saved yet."
        : envelopeMessage(payload, "Document settings loaded."),
    };
  },

  update: async (
    input: DocumentSettingsWritePayload,
  ): Promise<DocumentSettingsActionResult<DocumentSettings>> => {
    const body: DocumentSettingsWritePayload = {
      approval_required: toFlag(input.approval_required, 1),
      allow_edit_after_approval: toFlag(input.allow_edit_after_approval, 0),
      allow_cancel_after_approval: toFlag(input.allow_cancel_after_approval, 0),
      allow_reprint: toFlag(input.allow_reprint, 1),
      show_duplicate_on_reprint: toFlag(input.show_duplicate_on_reprint, 1),
    };

    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.documentSettings.save,
      body,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return fail("save", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return fail("save", 401, "Your session expired. Please sign in again.");
    }

    const source = pickFirst(payload);
    return {
      ok: true,
      data:
        Object.keys(source).length > 0
          ? asDocumentSettings(payload)
          : { ...body, setting_id: null },
      message: envelopeMessage(payload, "Document settings saved."),
    };
  },
};
