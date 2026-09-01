import { isAuthPublicPath, SIGN_IN_PATH } from "@/lib/auth/constants";
import { applyOrgIdToRequestBody } from "@/lib/auth/org-context";
import { clearAccessToken, getAccessToken } from "@/lib/auth/session";
import { env, getApiUrl } from "@/lib/env";

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  auth?: boolean;
  unwrap?: boolean;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  success?: boolean;
};

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
    if (Array.isArray(record.errors) && typeof record.errors[0] === "string") {
      return record.errors[0];
    }
    if (record.errors && typeof record.errors === "object" && !Array.isArray(record.errors)) {
      const first = Object.values(record.errors as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
      if (typeof first === "string") return first;
    }
  }
  return fallback;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return text || null;
}

function unwrapResponse<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as ApiEnvelope<T>).data !== undefined
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

const inflightGets = new Map<string, Promise<unknown>>();

function getRequestKey(method: string, path: string, auth: boolean, unwrap: boolean): string {
  return `${method}:${auth ? "auth" : "public"}:${unwrap ? "unwrap" : "raw"}:${getApiUrl(path)}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, unwrap = true, signal } = options;
  const canDedupe = method === "GET" && !signal;
  const requestKey = canDedupe ? getRequestKey(method, path, auth, unwrap) : null;

  if (requestKey) {
    const existing = inflightGets.get(requestKey);
    if (existing) return existing as Promise<T>;
  }

  const pending = sendRequest<T>(method, path, body, options);

  if (requestKey) {
    inflightGets.set(requestKey, pending);
    void pending.finally(() => {
      if (inflightGets.get(requestKey) === pending) inflightGets.delete(requestKey);
    });
  }

  return pending;
}

async function sendRequest<T>(
  method: string,
  path: string,
  body: unknown,
  options: RequestOptions,
): Promise<T> {
  const { auth = true, unwrap = true, headers, signal } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const requestBody =
    body === undefined ? undefined : isFormData ? body : applyOrgIdToRequestBody(body);
  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(requestBody !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.apiTimeoutMs);
  const abortSignal = signal ?? controller.signal;

  try {
    const response = await fetch(getApiUrl(path), {
      method,
      headers: requestHeaders,
      body:
        requestBody === undefined
          ? undefined
          : isFormData
            ? (requestBody as FormData)
            : JSON.stringify(requestBody),
      signal: abortSignal,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      if (response.status === 401 && auth) {
        clearAccessToken();
        if (typeof window !== "undefined" && !isAuthPublicPath(window.location.pathname)) {
          window.location.assign(SIGN_IN_PATH);
        }
      }
      throw new ApiError(
        extractErrorMessage(payload, `Request failed with status ${response.status}`),
        response.status,
        payload,
      );
    }

    return unwrap ? unwrapResponse<T>(payload) : (payload as T);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 408);
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error. Check your API connection.",
      0,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
