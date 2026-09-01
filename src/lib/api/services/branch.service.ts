import { appendOrgIdQuery, getCurrentOrgId, resolveOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { BranchListQuery, BranchRecord, BranchWritePayload } from "@/lib/api/types";
import { formatDateDisplay, parseDateToIso } from "@/lib/date-utils";
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

function optionalNumberText(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value).trim();
  return text ? text : null;
}

function asBranchList(payload: unknown): BranchRecord[] {
  if (Array.isArray(payload)) return payload as BranchRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as BranchRecord[];
  return [];
}

function asBranch(payload: unknown): BranchRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as BranchRecord;
}

export function branchToRow(record: BranchRecord, orgName = ""): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const branchId = readValue(source, ["Branch_Id", "branch_id", "id"]);
  const orgId = readValue(source, ["Org_Id", "org_id"]);
  const openDate = optionalText(readValue(source, ["Open_Date", "open_date"]));

  return {
    id: String(branchId ?? ""),
    Branch_Id: Number(branchId ?? 0),
    Org_Id: Number(orgId ?? 0),
    Org_Name: orgName || optionalText(readValue(source, ["Org_Name", "org_name"])) || "",
    Branch_Code: String(readValue(source, ["Branch_Code", "branch_code"]) ?? ""),
    Branch_Name: String(readValue(source, ["Branch_Name", "branch_name"]) ?? ""),
    Open_Date: openDate ? formatDateDisplay(openDate) : "",
    Address_line1: optionalText(readValue(source, ["Address_line1", "address_line1"])) ?? "",
    Address_line2: optionalText(readValue(source, ["Address_line2", "address_line2"])) ?? "",
    City: optionalText(readValue(source, ["City", "city"])) ?? "",
    State: optionalText(readValue(source, ["State", "state"])) ?? "",
    Pincode: optionalText(readValue(source, ["Pincode", "pincode"])) ?? "",
    Contact: optionalText(readValue(source, ["Contact", "contact"])) ?? "",
    Email: optionalText(readValue(source, ["Email", "email"])) ?? "",
    Latitude: optionalNumberText(readValue(source, ["Latitude", "latitude"])) ?? "",
    Longitude: optionalNumberText(readValue(source, ["Longitude", "longitude"])) ?? "",
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
  };
}

export function rowToBranchPayload(row: HrmsRow): BranchWritePayload {
  const openDate = optionalText(row.Open_Date);
  const isoOpenDate = openDate ? parseDateToIso(openDate) || openDate : null;

  return {
    org_id: resolveOrgId(row.Org_Id),
    branch_code: String(row.Branch_Code ?? "").trim(),
    branch_name: String(row.Branch_Name ?? "").trim(),
    open_date: isoOpenDate,
    address_line1: optionalText(row.Address_line1),
    address_line2: optionalText(row.Address_line2),
    city: optionalText(row.City),
    state: optionalText(row.State),
    pincode: optionalText(row.Pincode),
    contact: optionalText(row.Contact),
    email: optionalText(row.Email),
    latitude: optionalNumberText(row.Latitude),
    longitude: optionalNumberText(row.Longitude),
    status: toOrganizationStatus(row.Status),
  };
}

function withListQuery(basePath: string, query?: BranchListQuery) {
  const params = new URLSearchParams();
  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined) params.set("org_id", String(orgId));
  if (query?.status !== undefined) params.set("status", String(query.status));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const branchService = {
  list: async (query?: BranchListQuery, orgNameById?: Map<number, string>) => {
    const payload = await apiClient.get<unknown>(withListQuery(API_ENDPOINTS.branch.list, query));
    return asBranchList(payload).map((record) => {
      const orgId = Number((record as unknown as Record<string, unknown>).Org_Id ?? 0);
      const orgName = orgNameById?.get(orgId) ?? "";
      return branchToRow(record, orgName);
    });
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.branch.get(id));
    return branchToRow(asBranch(payload));
  },

  getByCode: async (orgId: string | number, code: string) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.branch.getByCode(orgId, code));
    return branchToRow(asBranch(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(API_ENDPOINTS.branch.create, rowToBranchPayload(row));
    return branchToRow(asBranch(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.branch.update(id),
      rowToBranchPayload(row),
    );
    return branchToRow(asBranch(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      appendOrgIdQuery(API_ENDPOINTS.branch.delete(id)),
      { unwrap: false },
    ),
};
