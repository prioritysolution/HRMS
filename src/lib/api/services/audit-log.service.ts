import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { extractPaginatedList } from "@/lib/api/paginated-list";
import type {
  AuditLogCreatePayload,
  AuditLogListQuery,
  AuditLogRecord,
} from "@/lib/api/types";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

const DEFAULT_PER_PAGE = 100;

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

function optionalText(value: unknown): string {
  if (value === undefined || value === null || value === false) return "";
  return String(value).trim();
}

function optionalId(value: unknown): number | "" {
  if (value === undefined || value === null || value === "") return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : "";
}

function asAuditLog(payload: unknown): AuditLogRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as AuditLogRecord;
}

function formatDateTimeDisplay(value: unknown): string {
  const raw = optionalText(value);
  if (!raw) return "";

  const normalized = raw.includes("T") ? raw.replace("T", " ") : raw;
  const [datePart, timePart = ""] = normalized.split(" ");
  const date = formatDateDisplay(datePart.slice(0, 10));
  const time = formatTimeDisplay(timePart.replace(/Z$/i, "").slice(0, 8));

  if (date && time) return `${date} ${time}`;
  return date || time || raw;
}

function formatJsonDisplay(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function withListQuery(basePath: string, query?: AuditLogListQuery) {
  const params = new URLSearchParams();
  if (!query) return basePath;

  if (query.audit_id !== undefined) params.set("audit_id", String(query.audit_id));
  if (query.user_id !== undefined) params.set("user_id", String(query.user_id));
  if (query.menu_name) params.set("menu_name", query.menu_name);
  if (query.table_name) params.set("table_name", query.table_name);
  if (query.record_id !== undefined) params.set("record_id", String(query.record_id));
  if (query.action !== undefined) params.set("action", String(query.action));
  if (query.search) params.set("search", query.search);
  if (query.from_date) params.set("from_date", query.from_date);
  if (query.to_date) params.set("to_date", query.to_date);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.per_page !== undefined) params.set("per_page", String(query.per_page));

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function auditLogToRow(record: AuditLogRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const auditId = readValue(source, ["Audit_id", "Audit_Id", "audit_id", "id"]);
  const actionCode = Number(
    readValue(source, ["Action_code", "action_code", "Action", "action"]) ?? 0,
  );
  const actionName =
    optionalText(readValue(source, ["Action_name", "action_name"])) ||
    (Number.isFinite(actionCode) && actionCode > 0 ? String(actionCode) : "");

  return {
    id: String(auditId ?? ""),
    Audit_id: Number(auditId ?? 0),
    User_id: optionalId(readValue(source, ["User_id", "User_Id", "user_id"])),
    User_Name: optionalText(readValue(source, ["User_Name", "user_name"])),
    Menu_name: optionalText(readValue(source, ["Menu_name", "Menu_Name", "menu_name"])),
    Table_name: optionalText(readValue(source, ["Table_name", "Table_Name", "table_name"])),
    Record_id: optionalId(readValue(source, ["Record_id", "Record_Id", "record_id"])),
    Action: Number.isFinite(actionCode) ? actionCode : "",
    Action_name: actionName,
    Old_values: formatJsonDisplay(
      readValue(source, ["Old_values", "Old_Values", "old_values"]),
    ),
    New_values: formatJsonDisplay(
      readValue(source, ["New_values", "New_Values", "new_values"]),
    ),
    Ip_address: optionalText(readValue(source, ["Ip_address", "Ip_Address", "ip_address"])),
    User_agent: optionalText(
      readValue(source, ["user_agent", "User_agent", "User_Agent"]),
    ),
    Created_at: formatDateTimeDisplay(
      readValue(source, ["Created_at", "Created_At", "created_at"]),
    ),
    Created_at_raw: optionalText(
      readValue(source, ["Created_at", "Created_At", "created_at"]),
    ),
  };
}

async function fetchPage(query?: AuditLogListQuery) {
  const payload = await apiClient.get<unknown>(
    withListQuery(API_ENDPOINTS.auditLog.list, query),
  );
  return extractPaginatedList<AuditLogRecord>(payload);
}

export const auditLogService = {
  listPage: async (query?: AuditLogListQuery) => {
    const page = query?.page ?? 1;
    const perPage = query?.per_page ?? DEFAULT_PER_PAGE;
    const { items, meta } = await fetchPage({
      ...query,
      page,
      per_page: perPage,
    });
    return {
      rows: items.map(auditLogToRow),
      total: Number(meta?.total ?? items.length),
    };
  },

  list: async (query?: AuditLogListQuery) => {
    const result = await auditLogService.listPage({
      ...query,
      page: query?.page ?? 1,
      per_page: query?.per_page ?? DEFAULT_PER_PAGE,
    });
    return result.rows;
  },

  create: async (payload: AuditLogCreatePayload) => {
    const response = await apiClient.post<unknown>(API_ENDPOINTS.auditLog.create, payload);
    return auditLogToRow(asAuditLog(response));
  },
};
