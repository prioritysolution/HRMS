import { apiClient, isSoftApiError } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  SmsEventRecord,
  SmsEventSavePayload,
  SmsGatewayCreatePayload,
  SmsGatewayRecord,
  SmsGatewayUpdatePayload,
  SmsTemplateListQuery,
  SmsTemplateRecord,
  SmsTemplateStatusPayload,
  SmsTemplateWritePayload,
} from "@/lib/api/types";

const SOFT_REQUEST = { throwOnError: false } as const;

/** Message Type — GET /api/v1/appl-options/list?opt_grp_id=20 */
export const SMS_MESSAGE_TYPE_OPT_GRP_ID = 20;

export type SmsConfigActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
  empty?: boolean;
  missingRoute?: boolean;
};

/** UI row for gateway form (api_key blank when masked / omitted). */
export type SmsGatewayConfig = SmsGatewayRecord & {
  exists: boolean;
};

/** UI row for event toggles. */
export type SmsEventSetting = {
  event_id: number;
  event_code: string;
  label: string;
  description: string;
  enabled: 0 | 1;
};

/** UI row for template table / modal. */
export type SmsTemplate = {
  id: string;
  template_name: string;
  event_id: number;
  event: string;
  event_code: string;
  message_template: string;
  status: 0 | 1;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data;
  const nested = asRecord(record.data);
  if (nested && Array.isArray(nested.data)) return nested.data;
  return [];
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

function toStatus(value: unknown): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

function isMaskedSecret(value: string): boolean {
  if (!value) return false;
  return /^\*+$|^•+$|^x+$/i.test(value) || /[•*]{4,}/.test(value);
}

function isMissingRoute(status: number, message: string, payload?: unknown): boolean {
  if (status === 404 || status === 405) return true;
  const exception = asText(asRecord(payload)?.exception);
  return /could not be found/i.test(message) || exception.includes("NotFoundHttpException");
}

function toUserMessage(
  status: number,
  message: string,
  action: "load" | "save" | "delete",
): string {
  if (isMissingRoute(status, message)) {
    if (action === "load") {
      return "Could not load SMS settings. The SMS configuration API is not available yet.";
    }
    if (action === "delete") {
      return "Could not delete. The SMS configuration API is not available yet.";
    }
    return "Could not save SMS settings. The SMS configuration API is not available yet.";
  }
  if (status === 408 || /timed out/i.test(message)) {
    return "Request timed out. Please try again.";
  }
  if (status === 0 || /network error/i.test(message)) {
    return "Network error. Check your API connection.";
  }
  return message || "Something went wrong. Please try again.";
}

function failAction<T>(
  action: "load" | "save" | "delete",
  status: number,
  message: string,
  payload?: unknown,
): SmsConfigActionResult<T> {
  return {
    ok: false,
    message: toUserMessage(status, message, action),
    missingRoute: isMissingRoute(status, message, payload),
  };
}

function emptyGateway(): SmsGatewayConfig {
  return {
    gateway_id: null,
    api_url: "",
    api_key: "",
    sender_id: "",
    message_type: "",
    status: 1,
    exists: false,
  };
}

export function asSmsGateway(payload: unknown): SmsGatewayConfig {
  const source = pickFirst(payload);
  const empty = Object.keys(source).length === 0;
  if (empty) return emptyGateway();

  const apiKeyRaw = asText(
    readValue(source, ["Api_Key", "api_key", "API_Key", "apiKey"]),
  );

  return {
    gateway_id: optionalNumber(
      readValue(source, ["Gateway_Id", "gateway_id", "Sms_Gateway_Id", "id"]),
    ),
    api_url: asText(readValue(source, ["Api_Url", "api_url", "API_Url", "apiUrl"])),
    api_key: apiKeyRaw && !isMaskedSecret(apiKeyRaw) ? apiKeyRaw : "",
    sender_id: asText(
      readValue(source, ["Sender_Id", "sender_id", "Sender_ID", "senderId"]),
    ),
    message_type: asText(
      readValue(source, ["Message_Type", "message_type", "MessageType"]),
    ),
    status: toStatus(readValue(source, ["Status", "status"])),
    exists: true,
  };
}

export function asSmsEvent(payload: unknown): SmsEventSetting {
  const source = asRecord(payload) ?? {};
  const eventId =
    optionalNumber(readValue(source, ["Event_Id", "event_id", "id"])) ?? 0;
  const eventCode = asText(
    readValue(source, ["Event_Code", "event_code", "EventCode", "key"]),
  );
  const eventName = asText(
    readValue(source, ["Event_Name", "event_name", "EventName", "label", "name"]),
  );
  const eventLabel = asText(
    readValue(source, ["Event_Label", "event_label", "EventLabel"]),
  );
  const description = asText(
    readValue(source, ["Description", "description", "Event_Description"]),
  );

  return {
    event_id: eventId,
    event_code: eventCode,
    label: eventName || eventLabel || eventCode || `Event ${eventId}`,
    description:
      description ||
      (eventLabel ? `${eventLabel} SMS notifications.` : "SMS notification event."),
    enabled: toStatus(readValue(source, ["Status", "status", "enabled", "Enabled"])),
  };
}

export function asSmsTemplate(payload: unknown): SmsTemplate {
  const source = asRecord(payload) ?? {};
  const templateId =
    optionalNumber(
      readValue(source, ["Template_Id", "template_id", "id"]),
    ) ?? 0;
  const eventId =
    optionalNumber(readValue(source, ["Event_Id", "event_id"])) ?? 0;
  const eventName = asText(
    readValue(source, ["Event_Name", "event_name", "Event_Label", "event_label"]),
  );
  const eventLabel = asText(
    readValue(source, ["Event_Label", "event_label"]),
  );

  return {
    id: String(templateId),
    template_name: asText(
      readValue(source, ["Template_Name", "template_name"]),
    ),
    event_id: eventId,
    event: eventLabel || eventName || String(eventId || ""),
    event_code: asText(readValue(source, ["Event_Code", "event_code"])),
    message_template: asText(
      readValue(source, ["Message_Template", "message_template"]),
    ),
    status: toStatus(readValue(source, ["Status", "status"])),
  };
}

function envelopeMessage(payload: unknown, fallback: string): string {
  return asText(asRecord(payload)?.message) || fallback;
}

function withTemplateSearch(basePath: string, query?: SmsTemplateListQuery) {
  const params = new URLSearchParams();
  if (query?.search?.trim()) params.set("search", query.search.trim());
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const smsConfigService = {
  getGateway: async (): Promise<SmsConfigActionResult<SmsGatewayConfig>> => {
    const payload = await apiClient.get<unknown>(
      API_ENDPOINTS.smsGateway.list,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return {
        ...failAction("load", payload.status, payload.message, payload.data),
        data: emptyGateway(),
      };
    }
    if (payload === undefined) {
      return failAction("load", 401, "Your session expired. Please sign in again.");
    }

    const source = pickFirst(payload);
    const empty = Object.keys(source).length === 0;
    return {
      ok: true,
      data: empty ? emptyGateway() : asSmsGateway(payload),
      empty,
      message: empty
        ? "No SMS gateway configured yet."
        : envelopeMessage(payload, "SMS gateway loaded."),
    };
  },

  /** Create when no gateway exists; otherwise update (omit blank api_key). */
  saveGateway: async (input: {
    api_url: string;
    api_key: string;
    sender_id: string;
    message_type: string;
    status: 0 | 1;
    exists?: boolean;
  }): Promise<SmsConfigActionResult<SmsGatewayConfig>> => {
    const apiUrl = asText(input.api_url);
    const senderId = asText(input.sender_id);
    const messageType = asText(input.message_type);
    const apiKey = String(input.api_key ?? "").trim();
    const status = input.status === 0 ? 0 : 1;

    let exists = Boolean(input.exists);
    if (input.exists === undefined) {
      const current = await smsConfigService.getGateway();
      exists = Boolean(current.data?.exists);
    }

    if (!exists) {
      if (!apiKey) {
        return { ok: false, message: "API key is required when creating the gateway." };
      }
      const body: SmsGatewayCreatePayload = {
        api_url: apiUrl,
        api_key: apiKey,
        sender_id: senderId,
        message_type: messageType,
        status,
      };
      const payload = await apiClient.post<unknown>(
        API_ENDPOINTS.smsGateway.create,
        body,
        SOFT_REQUEST,
      );
      if (isSoftApiError(payload)) {
        return failAction("save", payload.status, payload.message, payload.data);
      }
      if (payload === undefined) {
        return failAction("save", 401, "Your session expired. Please sign in again.");
      }
      const mapped = asSmsGateway(payload);
      return {
        ok: true,
        data: { ...mapped, exists: true, api_key: apiKey },
        message: envelopeMessage(payload, "SMS gateway configuration created."),
      };
    }

    const body: SmsGatewayUpdatePayload = {
      api_url: apiUrl,
      sender_id: senderId,
      message_type: messageType,
      status,
      ...(apiKey && !isMaskedSecret(apiKey) ? { api_key: apiKey } : {}),
    };
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.smsGateway.update,
      body,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return failAction("save", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return failAction("save", 401, "Your session expired. Please sign in again.");
    }
    const mapped = asSmsGateway(payload);
    return {
      ok: true,
      data: {
        ...mapped,
        exists: true,
        api_key: apiKey && !isMaskedSecret(apiKey) ? apiKey : mapped.api_key,
      },
      message: envelopeMessage(payload, "SMS gateway configuration saved."),
    };
  },

  getEvents: async (): Promise<SmsConfigActionResult<SmsEventSetting[]>> => {
    const payload = await apiClient.get<unknown>(
      API_ENDPOINTS.smsEvent.list,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return failAction("load", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return failAction("load", 401, "Your session expired. Please sign in again.");
    }
    const rows = asList(payload)
      .map(asSmsEvent)
      .filter((row) => row.event_id > 0 || row.event_code);
    return {
      ok: true,
      data: rows,
      message: envelopeMessage(payload, "SMS event settings loaded."),
    };
  },

  updateEvents: async (
    events: SmsEventSetting[],
  ): Promise<SmsConfigActionResult<SmsEventSetting[]>> => {
    const body: SmsEventSavePayload = {
      events: events.map((item) =>
        item.event_id > 0
          ? { event_id: item.event_id, status: item.enabled === 0 ? 0 : 1 }
          : { event_code: item.event_code, status: item.enabled === 0 ? 0 : 1 },
      ),
    };
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.smsEvent.save,
      body,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return failAction("save", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return failAction("save", 401, "Your session expired. Please sign in again.");
    }
    const rows = asList(payload)
      .map(asSmsEvent)
      .filter((row) => row.event_id > 0 || row.event_code);
    return {
      ok: true,
      data: rows.length > 0 ? rows : events,
      message: envelopeMessage(payload, "SMS event settings saved."),
    };
  },

  listTemplates: async (
    query?: SmsTemplateListQuery,
  ): Promise<SmsConfigActionResult<SmsTemplate[]>> => {
    const payload = await apiClient.get<unknown>(
      withTemplateSearch(API_ENDPOINTS.smsTemplate.list, query),
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return failAction("load", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return failAction("load", 401, "Your session expired. Please sign in again.");
    }
    return {
      ok: true,
      data: asList(payload).map(asSmsTemplate).filter((row) => row.id !== "0"),
      message: envelopeMessage(payload, "SMS templates loaded."),
    };
  },

  createTemplate: async (
    input: SmsTemplateWritePayload,
  ): Promise<SmsConfigActionResult<SmsTemplate>> => {
    const body: SmsTemplateWritePayload = {
      template_name: asText(input.template_name),
      event_id: Number(input.event_id),
      message_template: asText(input.message_template),
      status: input.status === 0 ? 0 : 1,
    };
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.smsTemplate.create,
      body,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return failAction("save", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return failAction("save", 401, "Your session expired. Please sign in again.");
    }
    const source = pickFirst(payload);
    return {
      ok: true,
      data: asSmsTemplate(Object.keys(source).length ? source : payload),
      message: envelopeMessage(payload, "SMS template added."),
    };
  },

  updateTemplate: async (
    id: string | number,
    input: SmsTemplateWritePayload,
  ): Promise<SmsConfigActionResult<SmsTemplate>> => {
    const body: SmsTemplateWritePayload = {
      template_name: asText(input.template_name),
      event_id: Number(input.event_id),
      message_template: asText(input.message_template),
      status: input.status === 0 ? 0 : 1,
    };
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.smsTemplate.update(id),
      body,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return failAction("save", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return failAction("save", 401, "Your session expired. Please sign in again.");
    }
    const source = pickFirst(payload);
    return {
      ok: true,
      data: asSmsTemplate(Object.keys(source).length ? source : { ...body, Template_Id: id }),
      message: envelopeMessage(payload, "SMS template updated."),
    };
  },

  updateTemplateStatus: async (
    id: string | number,
    status: 0 | 1,
  ): Promise<SmsConfigActionResult<SmsTemplate>> => {
    const body: SmsTemplateStatusPayload = { status: status === 0 ? 0 : 1 };
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.smsTemplate.status(id),
      body,
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return failAction("save", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return failAction("save", 401, "Your session expired. Please sign in again.");
    }
    const source = pickFirst(payload);
    return {
      ok: true,
      data: asSmsTemplate(
        Object.keys(source).length ? source : { Template_Id: id, Status: status },
      ),
      message: envelopeMessage(payload, "SMS template status updated."),
    };
  },

  removeTemplate: async (
    id: string | number,
  ): Promise<SmsConfigActionResult<null>> => {
    const payload = await apiClient.delete<unknown>(
      API_ENDPOINTS.smsTemplate.delete(id),
      SOFT_REQUEST,
    );
    if (isSoftApiError(payload)) {
      return failAction("delete", payload.status, payload.message, payload.data);
    }
    if (payload === undefined) {
      return failAction("delete", 401, "Your session expired. Please sign in again.");
    }
    return {
      ok: true,
      data: null,
      message: envelopeMessage(payload, "SMS template deleted."),
    };
  },
};
