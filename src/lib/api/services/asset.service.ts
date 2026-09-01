import { appendOrgIdQuery, getCurrentOrgId, resolveOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AssetListQuery,
  AssetRecord,
  AssetWritePayload,
} from "@/lib/api/types";
import { formatDateDisplay, parseDateToIso } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readValue(
  record: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === false) {
    return null;
  }

  const text = String(value).trim();
  return text ? text : null;
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asAssetList(payload: unknown): AssetRecord[] {
  if (Array.isArray(payload)) {
    return payload as AssetRecord[];
  }

  const record = asRecord(payload);

  if (!record) {
    return [];
  }

  if (Array.isArray(record.data)) {
    return record.data as AssetRecord[];
  }

  return [];
}

function asAsset(payload: unknown): AssetRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;

  return (nested ?? record ?? payload) as AssetRecord;
}

export function assetToRow(record: AssetRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;

  const assetId = readValue(source, [
    "Asset_id",
    "asset_id",
    "Asset_Id",
    "assetId",
    "id",
  ]);

  const assetType = readValue(source, [
    "Asset_type",
    "asset_type",
    "Asset_Type",
  ]);

  const assetTypeName = optionalText(
    readValue(source, [
      "Asset_type_name",
      "asset_type_name",
      "Asset_Type_Name",
    ]),
  );

  const assetCode = readValue(source, [
    "Asset_code",
    "asset_code",
    "Asset_Code",
  ]);

  const serialNumber = optionalText(
    readValue(source, [
      "Serial_number",
      "serial_number",
      "Serial_Number",
    ]),
  );

  const purchaseDate = optionalText(
    readValue(source, [
      "Purchase_date",
      "purchase_date",
      "Purchase_Date",
    ]),
  );

  const purchaseCost = optionalNumber(
    readValue(source, [
      "Purchase_cost",
      "purchase_cost",
      "Purchase_Cost",
    ]),
  );

  const warrantyExpiry = optionalText(
    readValue(source, [
      "Warranty_expiry",
      "warranty_expiry",
      "Warranty_Expiry",
    ]),
  );

  const assetStatus = readValue(source, [
    "Asset_status",
    "asset_status",
    "Asset_Status",
  ]);

  const remarks = optionalText(
    readValue(source, ["Remarks", "remarks"]),
  );

  return {
    id: String(assetId ?? ""),
    Asset_id: Number(assetId ?? 0),
    Asset_type: Number(assetType ?? 0),
    Asset_type_name: assetTypeName ?? "",
    Asset_code: String(assetCode ?? ""),
    Serial_number: serialNumber ?? "",
    Purchase_date: purchaseDate
      ? formatDateDisplay(purchaseDate)
      : "",
    Purchase_cost: purchaseCost ?? "",
    Warranty_expiry: warrantyExpiry
      ? formatDateDisplay(warrantyExpiry)
      : "",
    Asset_status:
      assetStatus === undefined || assetStatus === null
        ? ""
        : String(assetStatus),
    Remarks: remarks ?? "",
  };
}

export function rowToAssetPayload(
  row: HrmsRow,
): AssetWritePayload {
  const purchaseDate = optionalText(row.Purchase_date);
  const warrantyExpiry = optionalText(row.Warranty_expiry);

  const purchaseDateIso = purchaseDate
    ? parseDateToIso(purchaseDate) || purchaseDate
    : null;

  const warrantyExpiryIso = warrantyExpiry
    ? parseDateToIso(warrantyExpiry) || warrantyExpiry
    : null;

  const purchaseCost =
    row.Purchase_cost === undefined ||
    row.Purchase_cost === null ||
    row.Purchase_cost === ""
      ? null
      : Number(row.Purchase_cost);

  return {
    org_id: resolveOrgId(row.Org_Id),
    asset_type: Number(row.Asset_type ?? 0),
    asset_code: String(row.Asset_code ?? "").trim(),
    serial_number: optionalText(row.Serial_number),
    purchase_date: purchaseDateIso,
    purchase_cost:
      purchaseCost !== null && Number.isFinite(purchaseCost)
        ? purchaseCost
        : null,
    warranty_expiry: warrantyExpiryIso,
    asset_status:
      row.Asset_status === undefined ||
      row.Asset_status === null ||
      row.Asset_status === ""
        ? 1
        : Number(row.Asset_status) as 0 | 1,
    remarks: optionalText(row.Remarks),
  };
}

function withListQuery(
  basePath: string,
  query?: AssetListQuery,
) {
  const params = new URLSearchParams();

  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined) {
    params.set("org_id", String(orgId));
  }

  if (query?.asset_id !== undefined) {
    params.set("asset_id", String(query.asset_id));
  }

  if (query?.asset_code) {
    params.set("asset_code", query.asset_code);
  }

  if (query?.asset_type !== undefined) {
    params.set("asset_type", String(query.asset_type));
  }

  if (query?.asset_status !== undefined) {
    params.set("asset_status", String(query.asset_status));
  }

  const suffix = params.toString();

  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const assetService = {
  list: async (query?: AssetListQuery) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.asset.list, query),
    );

    return asAssetList(payload).map(assetToRow);
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.asset.create,
      rowToAssetPayload(row),
    );

    return assetToRow(asAsset(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.asset.update(id),
      rowToAssetPayload(row),
    );

    return assetToRow(asAsset(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{
      success?: boolean;
      message?: string;
      data?: null;
    }>(appendOrgIdQuery(API_ENDPOINTS.asset.delete(id)), {
      unwrap: false,
    }),
};