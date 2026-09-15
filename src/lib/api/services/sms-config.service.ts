import {
  MOCK_SMS_EVENTS,
  MOCK_SMS_GATEWAY,
  MOCK_SMS_TEMPLATES,
  type SmsEventSetting,
  type SmsGatewayConfig,
  type SmsTemplate,
} from "@/data/settings-mock";

export type SmsConfigActionResult<T> = {
  ok: boolean;
  data?: T;
  message: string;
};

function cloneGateway(source: SmsGatewayConfig): SmsGatewayConfig {
  return { ...source };
}

function cloneEvents(source: SmsEventSetting[]): SmsEventSetting[] {
  return source.map((item) => ({ ...item }));
}

function cloneTemplates(source: SmsTemplate[]): SmsTemplate[] {
  return source.map((item) => ({ ...item }));
}

/** In-memory demo store until SMS APIs are available. */
let gatewayStore = cloneGateway(MOCK_SMS_GATEWAY);
let eventsStore = cloneEvents(MOCK_SMS_EVENTS);
let templatesStore = cloneTemplates(MOCK_SMS_TEMPLATES);
let nextTemplateId = templatesStore.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const smsConfigService = {
  getGateway: async (): Promise<SmsConfigActionResult<SmsGatewayConfig>> => {
    await delay();
    return {
      ok: true,
      data: cloneGateway(gatewayStore),
      message: "SMS gateway loaded (demo).",
    };
  },

  updateGateway: async (
    payload: SmsGatewayConfig,
  ): Promise<SmsConfigActionResult<SmsGatewayConfig>> => {
    await delay();
    gatewayStore = cloneGateway({
      ...payload,
      api_url: payload.api_url.trim(),
      api_key: payload.api_key.trim() || gatewayStore.api_key,
      sender_id: payload.sender_id.trim(),
      message_type: payload.message_type,
      status: payload.status === 0 ? 0 : 1,
    });
    return {
      ok: true,
      data: cloneGateway(gatewayStore),
      message: "SMS gateway configuration saved (demo).",
    };
  },

  getEvents: async (): Promise<SmsConfigActionResult<SmsEventSetting[]>> => {
    await delay();
    return {
      ok: true,
      data: cloneEvents(eventsStore),
      message: "SMS event settings loaded (demo).",
    };
  },

  updateEvents: async (
    events: SmsEventSetting[],
  ): Promise<SmsConfigActionResult<SmsEventSetting[]>> => {
    await delay();
    const byKey = new Map(events.map((item) => [item.key, item.enabled === 0 ? 0 : 1] as const));
    eventsStore = eventsStore.map((item) => ({
      ...item,
      enabled: byKey.get(item.key) ?? item.enabled,
    }));
    return {
      ok: true,
      data: cloneEvents(eventsStore),
      message: "SMS event settings saved (demo).",
    };
  },

  listTemplates: async (): Promise<SmsConfigActionResult<SmsTemplate[]>> => {
    await delay();
    return {
      ok: true,
      data: cloneTemplates(templatesStore),
      message: "SMS templates loaded (demo).",
    };
  },

  createTemplate: async (
    payload: Omit<SmsTemplate, "id">,
  ): Promise<SmsConfigActionResult<SmsTemplate>> => {
    await delay();
    const created: SmsTemplate = {
      id: String(nextTemplateId++),
      template_name: payload.template_name.trim(),
      event: payload.event.trim(),
      message_template: payload.message_template.trim(),
      status: payload.status === 0 ? 0 : 1,
    };
    templatesStore = [...templatesStore, created];
    return {
      ok: true,
      data: { ...created },
      message: "SMS template added (demo).",
    };
  },

  updateTemplate: async (
    id: string,
    payload: Omit<SmsTemplate, "id">,
  ): Promise<SmsConfigActionResult<SmsTemplate>> => {
    await delay();
    const index = templatesStore.findIndex((row) => row.id === id);
    if (index < 0) {
      return { ok: false, message: "Template not found." };
    }
    const updated: SmsTemplate = {
      id,
      template_name: payload.template_name.trim(),
      event: payload.event.trim(),
      message_template: payload.message_template.trim(),
      status: payload.status === 0 ? 0 : 1,
    };
    templatesStore = templatesStore.map((row) => (row.id === id ? updated : row));
    return {
      ok: true,
      data: { ...updated },
      message: "SMS template updated (demo).",
    };
  },

  removeTemplate: async (id: string): Promise<SmsConfigActionResult<null>> => {
    await delay();
    const exists = templatesStore.some((row) => row.id === id);
    if (!exists) {
      return { ok: false, message: "Template not found." };
    }
    templatesStore = templatesStore.filter((row) => row.id !== id);
    return {
      ok: true,
      data: null,
      message: "SMS template deleted (demo).",
    };
  },
};
