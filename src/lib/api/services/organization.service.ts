import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  OrganizationListQuery,
  OrganizationRecord,
  OrganizationStatus,
  OrganizationWritePayload,
} from "@/lib/api/types";
import { resolvePublicFileUrl } from "@/lib/env";
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

export function toOrganizationStatus(value: unknown): OrganizationStatus {
  if (value === 0 || value === "0" || value === false) return 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "inactive" || normalized === "0") return 0;
  }
  return 1;
}

export function toOrganizationStatusLabel(value: unknown): "Active" | "Inactive" {
  return toOrganizationStatus(value) === 1 ? "Active" : "Inactive";
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === false) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function asOrganizationList(payload: unknown): OrganizationRecord[] {
  if (Array.isArray(payload)) return payload as OrganizationRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as OrganizationRecord[];
  return [];
}

function asOrganization(payload: unknown): OrganizationRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as OrganizationRecord;
}

export function organizationToRow(record: OrganizationRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const orgId = readValue(source, ["Org_Id", "org_id", "id"]);
  const logoPath = optionalText(readValue(source, ["Logo_Path", "logo_path"])) ?? "";
  const logoUrl =
    optionalText(readValue(source, ["Logo_Url", "logo_url"])) ??
    (logoPath ? resolvePublicFileUrl(logoPath) : "");

  return {
    id: String(orgId ?? ""),
    Org_Id: Number(orgId ?? 0),
    Org_Cd: String(readValue(source, ["Org_Cd", "org_cd"]) ?? ""),
    Org_Name: String(readValue(source, ["Org_Name", "org_name"]) ?? ""),
    Legal_Name: optionalText(readValue(source, ["Legal_Name", "legal_name"])) ?? "",
    Regd_No: optionalText(readValue(source, ["Regd_No", "regd_no"])) ?? "",
    Email: optionalText(readValue(source, ["Email", "email"])) ?? "",
    Contact: optionalText(readValue(source, ["Contact", "contact"])) ?? "",
    Website: optionalText(readValue(source, ["Website", "website"])) ?? "",
    Address_line1: optionalText(readValue(source, ["Address_line1", "address_line1"])) ?? "",
    Address_line2: optionalText(readValue(source, ["Address_line2", "address_line2"])) ?? "",
    City: optionalText(readValue(source, ["City", "city"])) ?? "",
    State: optionalText(readValue(source, ["State", "state"])) ?? "",
    Country: optionalText(readValue(source, ["Country", "country"])) ?? "India",
    Pincode: optionalText(readValue(source, ["Pincode", "pincode"])) ?? "",
    Logo_Path: logoPath,
    Logo_Url: logoUrl,
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
    Created_at: optionalText(readValue(source, ["Created_at", "created_at"])) ?? "",
    Updated_at: optionalText(readValue(source, ["Updated_at", "updated_at"])) ?? "",
  };
}

function getLogoFile(row: HrmsRow): File | null {
  return row.Logo instanceof File ? row.Logo : null;
}

export function rowToOrganizationPayload(row: HrmsRow): OrganizationWritePayload {
  const payload: OrganizationWritePayload = {
    org_cd: String(row.Org_Cd ?? "").trim(),
    org_name: String(row.Org_Name ?? "").trim(),
    legal_name: optionalText(row.Legal_Name),
    regd_no: optionalText(row.Regd_No),
    email: optionalText(row.Email),
    contact: optionalText(row.Contact),
    website: optionalText(row.Website),
    address_line1: optionalText(row.Address_line1),
    address_line2: optionalText(row.Address_line2),
    city: optionalText(row.City),
    state: optionalText(row.State),
    country: optionalText(row.Country) ?? "India",
    pincode: optionalText(row.Pincode),
    status: toOrganizationStatus(row.Status),
  };

  if (!getLogoFile(row)) {
    payload.logo_path = optionalText(row.Logo_Path);
  }

  return payload;
}

function toOrganizationFormData(row: HrmsRow): FormData {
  const payload = rowToOrganizationPayload(row);
  const formData = new FormData();
  const logoFile = getLogoFile(row);

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined || key === "logo_path") return;
    formData.append(key, String(value));
  });

  if (logoFile) {
    formData.append("logo_path", logoFile, logoFile.name);
    formData.append("logo", logoFile, logoFile.name);
  }

  return formData;
}

function withStatusQuery(basePath: string, query?: OrganizationListQuery) {
  if (query?.status === undefined) return basePath;
  const params = new URLSearchParams({ status: String(query.status) });
  return `${basePath}?${params.toString()}`;
}

export const organizationService = {
  list: async (query?: OrganizationListQuery) => {
    const payload = await apiClient.get<unknown>(
      withStatusQuery(API_ENDPOINTS.organization.list, query),
    );
    return asOrganizationList(payload).map(organizationToRow);
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.organization.get(id));
    return organizationToRow(asOrganization(payload));
  },

  getByCode: async (code: string) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.organization.getByCode(code));
    return organizationToRow(asOrganization(payload));
  },

  create: async (row: HrmsRow) => {
    const body = getLogoFile(row) ? toOrganizationFormData(row) : rowToOrganizationPayload(row);
    const payload = await apiClient.post<unknown>(API_ENDPOINTS.organization.create, body);
    return organizationToRow(asOrganization(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    if (getLogoFile(row)) {
      const formData = toOrganizationFormData(row);
      formData.append("_method", "PUT");
      const payload = await apiClient.post<unknown>(API_ENDPOINTS.organization.update(id), formData);
      return organizationToRow(asOrganization(payload));
    }

    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.organization.update(id),
      rowToOrganizationPayload(row),
    );
    return organizationToRow(asOrganization(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.organization.delete(id),
      { unwrap: false },
    ),
};
