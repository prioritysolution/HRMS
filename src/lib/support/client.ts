import { env } from "@/lib/env";

const TOKEN_KEY = "supportToken";
const PHONE_KEY = "supportPhone";
const DOMAIN_KEY = "supportDomain";

export type SupportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SupportStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

export type SupportScreenshot = {
  name?: string;
  url: string;
};

export type SupportProject = {
  name: string;
  domain: string;
};

export type SupportTicketSummary = {
  number: string;
  subject: string;
  priority: SupportPriority;
  status: SupportStatus;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketList = {
  items: SupportTicketSummary[];
  total: number;
  page: number;
  pageSize: number;
  from: number;
  to: number;
};

export type SupportTicket = {
  number: string;
  subject: string;
  description: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  priority: SupportPriority;
  status: SupportStatus;
  remark: string | null;
  screenshots: SupportScreenshot[];
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: string;
  side: "client" | "staff";
  authorName: string;
  message: string;
  screenshots: SupportScreenshot[];
  createdAt: string;
};

export type SupportCreatedTicket = {
  number: string;
  subject: string;
  priority: SupportPriority;
  status: SupportStatus;
  remark: string | null;
  updatedAt: string;
  accessToken: string;
};

export type SupportRealtimeConfig = {
  broadcaster: string;
  key: string;
  host: string;
  port: number;
  scheme: string;
  authEndpoint: string;
  soundUrl: string;
  customerChannel: string;
  ticketChannel: string | null;
};

export type SupportSignal = {
  type?: string;
  sound?: boolean;
  notificationId?: string | null;
  ticketId?: string;
  number?: string;
  title?: string;
  body?: string;
  hasImages?: boolean;
  refresh?: string[];
};

type SupportSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export class SupportError extends Error {
  status: number;
  errors: Record<string, string[]> | null;

  constructor(message: string, status: number, errors: Record<string, string[]> | null) {
    super(message);
    this.name = "SupportError";
    this.status = status;
    this.errors = errors;
  }
}

export function getSupportDomain(): string {
  if (typeof window !== "undefined" && window.location.host) return window.location.host;
  return env.supportDomain;
}

export function getSupportApiKey(): string {
  return env.supportApiKey;
}

export type SupportSession = {
  token: string;
  phone: string;
  domain: string;
};

export function readSupportSession(domain: string): SupportSession {
  if (typeof window === "undefined") return { token: "", phone: "", domain };
  try {
    const savedDomain = window.localStorage.getItem(DOMAIN_KEY) ?? "";
    const phone = window.localStorage.getItem(PHONE_KEY) ?? "";
    const token = window.localStorage.getItem(TOKEN_KEY) ?? "";
    if (!token || !phone || savedDomain !== domain) {
      return { token: "", phone: savedDomain === domain ? phone : "", domain };
    }
    return { token, phone, domain };
  } catch {
    return { token: "", phone: "", domain };
  }
}

export function saveSupportSession(session: SupportSession) {
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(PHONE_KEY, session.phone);
  window.localStorage.setItem(DOMAIN_KEY, session.domain);
  window.dispatchEvent(new Event("support-session"));
}

const UNREAD_KEY = "supportUnread";
const NOTICES_KEY = "supportNotices";

export type SupportNotice = {
  id: string;
  number: string;
  title: string;
  body: string;
  at: number;
  unread: boolean;
};

export function supportNoticeText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const text = value.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  if (!text || /data:image|\/storage\//i.test(text)) return "";
  return text.slice(0, max);
}

function readJson(key: string, fallback: unknown) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function readSupportUnread(): string[] {
  if (typeof window === "undefined") return [];
  const value = readJson(UNREAD_KEY, []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function readSupportNotices(): SupportNotice[] {
  if (typeof window === "undefined") return [];
  const value = readJson(NOTICES_KEY, []);
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SupportNotice => {
    if (!item || typeof item !== "object") return false;
    const row = item as Partial<SupportNotice>;
    return typeof row.id === "string" && typeof row.number === "string" && typeof row.at === "number";
  }).map((item) => ({
    id: item.id,
    number: item.number,
    title: typeof item.title === "string" ? item.title : "",
    body: typeof item.body === "string" ? item.body : "",
    at: item.at,
    unread: Boolean(item.unread),
  }));
}

export function writeSupportInbox(unread: string[], notices: SupportNotice[]) {
  window.localStorage.setItem(UNREAD_KEY, JSON.stringify(unread));
  window.localStorage.setItem(NOTICES_KEY, JSON.stringify(notices.slice(0, 20)));
}

export function clearSupportSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(PHONE_KEY);
  window.localStorage.removeItem(DOMAIN_KEY);
  window.localStorage.removeItem(UNREAD_KEY);
  window.localStorage.removeItem(NOTICES_KEY);
  window.dispatchEvent(new Event("support-session"));
}

type SupportFetchOptions = {
  method?: string;
  body?: string;
  token?: string;
  headers?: Record<string, string>;
};

export async function supportFetch<T>(path: string, options: SupportFetchOptions = {}): Promise<SupportSuccess<T>> {
  const apiKey = getSupportApiKey();
  const response = await fetch(`${env.supportApiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    credentials: "omit",
    body: options.body,
    headers: {
      Accept: "application/json",
      "X-Api-Key": apiKey,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { "X-Client-Token": options.token } : {}),
      ...options.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as
    | (SupportSuccess<T> & { errors?: Record<string, string[]> })
    | { success?: false; message?: string; errors?: Record<string, string[]> }
    | null;

  if (!response.ok || !body || ("success" in body && body.success === false) || !("data" in body)) {
    const message = body && "message" in body && body.message ? body.message : "The request could not be completed.";
    const errors = body && "errors" in body && body.errors ? body.errors : null;
    throw new SupportError(message, response.status, errors);
  }

  return body;
}

export function firstFieldErrors(errors: Record<string, string[]> | null): Record<string, string> {
  if (!errors) return {};
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? ""]),
  );
}

export async function filesToScreenshots(files: File[]) {
  const screenshots = await Promise.all(
    files.map(
      (file) =>
        new Promise<{ name: string; data: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, data: String(reader.result ?? "") });
          reader.onerror = () => reject(new Error("The image could not be read."));
          reader.readAsDataURL(file);
        }),
    ),
  );
  return screenshots;
}

export type SupportClientToken = {
  accessToken: string;
  customerPhone: string;
  domain: string;
};

let clientTokenRequest: Promise<SupportSession> | null = null;

export async function requestSupportClientToken(
  customerPhone: string,
  domain = getSupportDomain(),
): Promise<SupportSession> {
  const phone = customerPhone.trim();
  if (!phone) {
    throw new SupportError("The customer phone field is required.", 422, { customerPhone: ["The customer phone field is required."] });
  }

  const result = await supportFetch<SupportClientToken>("/integrations/redirect/client-token", {
    method: "POST",
    body: JSON.stringify({
      domain,
      customerPhone: phone,
    }),
  });

  const session: SupportSession = {
    token: result.data.accessToken,
    phone: result.data.customerPhone || phone,
    domain: result.data.domain || domain,
  };
  if (!session.token) {
    throw new SupportError("The request could not be completed.", 500, null);
  }
  saveSupportSession(session);
  return session;
}

export function ensureSupportClientToken(
  customerPhone: string,
  domain = getSupportDomain(),
): Promise<SupportSession> {
  const phone = customerPhone.trim();
  const session = readSupportSession(domain);
  if (session.token && session.phone === phone) return Promise.resolve(session);
  if (!clientTokenRequest) {
    clientTokenRequest = requestSupportClientToken(phone, domain).finally(() => {
      clientTokenRequest = null;
    });
  }
  return clientTokenRequest;
}
