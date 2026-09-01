import { appendOrgIdQuery, getCurrentOrgId, resolveOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  DesignationListQuery,
  DesignationRecord,
  DesignationWritePayload,
} from "@/lib/api/types";
import {
  toOrganizationStatus,
  toOrganizationStatusLabel,
} from "@/lib/api/services/organization.service";
import type { HrmsRow } from "@/types/hrms";

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

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === false) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function asDesignationList(payload: unknown): DesignationRecord[] {
  if (Array.isArray(payload)) return payload as DesignationRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as DesignationRecord[];
  return [];
}

function asDesignation(payload: unknown): DesignationRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as DesignationRecord;
}

export function designationToRow(record: DesignationRecord, orgName = ""): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const desigId = readValue(source, ["Desig_Id", "desig_id", "id"]);
  const orgId = readValue(source, ["Org_Id", "org_id"]);
  const levelNo = readValue(source, ["Level_No", "level_no"]);

  return {
    id: String(desigId ?? ""),
    Desig_Id: Number(desigId ?? 0),
    Org_Id: Number(orgId ?? 0),
    Org_Name: orgName || optionalText(readValue(source, ["Org_Name", "org_name"])) || "",
    Desig_Code: String(readValue(source, ["Desig_Code", "desig_code"]) ?? ""),
    Desig_Name: String(readValue(source, ["Desig_Name", "desig_name"]) ?? ""),
    Level_No: levelNo === undefined || levelNo === null || levelNo === "" ? 0 : Number(levelNo),
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
  };
}

export function rowToDesignationPayload(row: HrmsRow): DesignationWritePayload {
  const levelRaw = row.Level_No;
  const levelNo =
    levelRaw === undefined || levelRaw === null || levelRaw === ""
      ? 0
      : Number(levelRaw);

  return {
    org_id: resolveOrgId(row.Org_Id),
    desig_code: String(row.Desig_Code ?? "").trim(),
    desig_name: String(row.Desig_Name ?? "").trim(),
    level_no: Number.isFinite(levelNo) ? levelNo : 0,
    status: toOrganizationStatus(row.Status),
  };
}

function withListQuery(basePath: string, query?: DesignationListQuery) {
  const params = new URLSearchParams();
  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined) params.set("org_id", String(orgId));
  if (query?.status !== undefined) params.set("status", String(query.status));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const designationService = {
  list: async (query?: DesignationListQuery, orgNameById?: Map<number, string>) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.designation.list, query),
    );
    return asDesignationList(payload).map((record) => {
      const orgId = Number((record as unknown as Record<string, unknown>).Org_Id ?? 0);
      const orgName = orgNameById?.get(orgId) ?? "";
      return designationToRow(record, orgName);
    });
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.designation.get(id));
    return designationToRow(asDesignation(payload));
  },

  getByCode: async (orgId: string | number, code: string) => {
    const payload = await apiClient.get<unknown>(
      API_ENDPOINTS.designation.getByCode(orgId, code),
    );
    return designationToRow(asDesignation(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.designation.create,
      rowToDesignationPayload(row),
    );
    return designationToRow(asDesignation(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.designation.update(id),
      rowToDesignationPayload(row),
    );
    return designationToRow(asDesignation(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      appendOrgIdQuery(API_ENDPOINTS.designation.delete(id)),
      { unwrap: false },
    ),
};
