import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AuditLogCreatePayload, AuditLogRecord } from "@/lib/api/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asAuditLog(payload: unknown): AuditLogRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as AuditLogRecord;
}

export const auditLogService = {
  create: async (payload: AuditLogCreatePayload) => {
    const response = await apiClient.post<unknown>(API_ENDPOINTS.auditLog.create, payload);
    return asAuditLog(response);
  },
};
