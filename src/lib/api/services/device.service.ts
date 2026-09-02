import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { DeviceListQuery, DeviceRecord, DeviceWritePayload } from "@/lib/api/types";
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

function optionalPort(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asDeviceList(payload: unknown): DeviceRecord[] {
  if (Array.isArray(payload)) return payload as DeviceRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as DeviceRecord[];
  return [];
}

function asDevice(payload: unknown): DeviceRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as DeviceRecord;
}

export function deviceToRow(record: DeviceRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const deviceId = readValue(source, ["Device_id", "device_id", "id"]);
  const port = readValue(source, ["Port", "port"]);

  return {
    id: String(deviceId ?? ""),
    Device_id: Number(deviceId ?? 0),
    Device_name: String(readValue(source, ["Device_name", "device_name"]) ?? ""),
    Ip_address: String(readValue(source, ["Ip_address", "ip_address"]) ?? ""),
    Port: port === undefined || port === null || port === "" ? "" : Number(port),
    Location: optionalText(readValue(source, ["Location", "location"])) ?? "",
    Device_model: optionalText(readValue(source, ["Device_model", "device_model"])) ?? "",
    Serial_no: optionalText(readValue(source, ["Serial_no", "serial_no"])) ?? "",
    Last_sync_time: optionalText(readValue(source, ["Last_sync_time", "last_sync_time"])) ?? "",
    Created_at: optionalText(readValue(source, ["Created_at", "created_at"])) ?? "",
    Status: toOrganizationStatusLabel(readValue(source, ["Status", "status"])),
  };
}

export function rowToDevicePayload(row: HrmsRow): DeviceWritePayload {
  const port = optionalPort(row.Port);

  return {
    device_name: String(row.Device_name ?? "").trim(),
    ip_address: String(row.Ip_address ?? "").trim(),
    port: port ?? 4370,
    location: optionalText(row.Location),
    device_model: optionalText(row.Device_model),
    serial_no: optionalText(row.Serial_no),
    status: toOrganizationStatus(row.Status),
  };
}

function withListQuery(basePath: string, query?: DeviceListQuery) {
  const params = new URLSearchParams();

  if (query?.device_id !== undefined) params.set("device_id", String(query.device_id));
  if (query?.device_name) params.set("device_name", query.device_name);
  if (query?.ip_address) params.set("ip_address", query.ip_address);
  if (query?.serial_no) params.set("serial_no", query.serial_no);
  if (query?.status !== undefined) params.set("status", String(query.status));

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const deviceService = {
  list: async (query?: DeviceListQuery) => {
    const payload = await apiClient.get<unknown>(withListQuery(API_ENDPOINTS.device.list, query));
    return asDeviceList(payload).map(deviceToRow);
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(API_ENDPOINTS.device.get(id));
    const records = asDeviceList(payload);
    if (records.length > 0) return deviceToRow(records[0]);
    return deviceToRow(asDevice(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.device.create,
      rowToDevicePayload(row),
    );
    return deviceToRow(asDevice(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.device.update(id),
      rowToDevicePayload(row),
    );
    return deviceToRow(asDevice(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.device.delete(id),
      { unwrap: false },
    ),

  sync: async () => {
    // The endpoint returns an envelope { success, message, data }
    const response = await apiClient.post<{ message?: string; data?: any }>(
      API_ENDPOINTS.device.sync,
      {},
      { unwrap: false }
    );
    return response as { message?: string; data?: any; success?: boolean };
  },
};
