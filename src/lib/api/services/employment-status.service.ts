import { appendOrgIdQuery, getCurrentOrgId, resolveOrgId } from "@/lib/auth/org-context";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  EmploymentStatus,
  EmploymentStatusListQuery,
  EmploymentStatusRecord,
  EmploymentStatusWritePayload,
} from "@/lib/api/types";
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

function optionalText(value: unknown): string {
  if (value === undefined || value === null || value === false) {
    return "";
  }

  return String(value).trim();
}

function toEmploymentStatus(value: unknown): EmploymentStatus {
  if (
    value === 0 ||
    value === "0" ||
    value === false
  ) {
    return 0;
  }

  if (
    typeof value === "string" &&
    value.trim().toLowerCase() === "inactive"
  ) {
    return 0;
  }

  return 1;
}

function toEmploymentStatusLabel(
  value: unknown,
): "Active" | "Inactive" {
  return toEmploymentStatus(value) === 1
    ? "Active"
    : "Inactive";
}

function asEmploymentStatusList(
  payload: unknown,
): EmploymentStatusRecord[] {
  if (Array.isArray(payload)) {
    return payload as EmploymentStatusRecord[];
  }

  const record = asRecord(payload);

  if (!record) {
    return [];
  }

  if (Array.isArray(record.data)) {
    return record.data as EmploymentStatusRecord[];
  }

  return [];
}

function asEmploymentStatus(
  payload: unknown,
): EmploymentStatusRecord {
  const record = asRecord(payload);
  const nested = record
    ? asRecord(record.data)
    : null;

  return (nested ?? record ?? payload) as EmploymentStatusRecord;
}

export function employmentStatusToRow(
  record: EmploymentStatusRecord,
): HrmsRow {
  const source =
    record as unknown as Record<string, unknown>;

  const id = readValue(source, [
    "Emp_status_id",
    "emp_status_id",
    "id",
  ]);

  return {
    id: String(id ?? ""),
    Emp_status_id: Number(id ?? 0),

    Status_code: optionalText(
      readValue(source, [
        "Status_code",
        "status_code",
      ]),
    ),

    Status_name: optionalText(
      readValue(source, [
        "Status_name",
        "status_name",
      ]),
    ),

    status: toEmploymentStatusLabel(
      readValue(source, [
        "Status",
        "status",
      ]),
    ),
  };
}

function deriveStatusCode(statusName: string, existing?: unknown): string {
  const fromExisting = optionalText(existing);
  if (fromExisting) return fromExisting;

  const name = statusName.trim();
  if (!name) return "";

  const slug = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  return slug || name.toUpperCase().slice(0, 20);
}

export function rowToEmploymentStatusPayload(
  row: HrmsRow,
): EmploymentStatusWritePayload {
  const statusName = String(row.Status_name ?? "").trim();

  return {
    org_id: resolveOrgId(row.Org_Id),
    status_code: deriveStatusCode(statusName, row.Status_code),

    status_name: statusName,

    status: toEmploymentStatus(
      row.status ?? row.Status,
    ),
  };
}

function withListQuery(
  basePath: string,
  query?: EmploymentStatusListQuery,
): string {
  const params = new URLSearchParams();

  const orgId = query?.org_id ?? getCurrentOrgId();
  if (orgId !== undefined) {
    params.set("org_id", String(orgId));
  }

  if (query?.status !== undefined) {
    params.set(
      "status",
      String(query.status),
    );
  }

  if (query?.emp_status_id !== undefined) {
    params.set(
      "emp_status_id",
      String(query.emp_status_id),
    );
  }

  if (query?.status_code !== undefined) {
    params.set(
      "status_code",
      String(query.status_code),
    );
  }

  const suffix = params.toString();

  return suffix
    ? `${basePath}?${suffix}`
    : basePath;
}

export const employmentStatusService = {
  list: async (
    query?: EmploymentStatusListQuery,
  ) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(
        API_ENDPOINTS.employmentStatus.list,
        query,
      ),
    );

    return asEmploymentStatusList(payload)
      .map(employmentStatusToRow);
  },

  getById: async (
    id: string | number,
  ) => {
    const payload = await apiClient.get<unknown>(
      API_ENDPOINTS.employmentStatus.get(id),
    );

    const records =
      asEmploymentStatusList(payload);

    if (records.length > 0) {
      return employmentStatusToRow(
        records[0],
      );
    }

    return employmentStatusToRow(
      asEmploymentStatus(payload),
    );
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.employmentStatus.create,
      rowToEmploymentStatusPayload(row),
    );

    return employmentStatusToRow(
      asEmploymentStatus(payload),
    );
  },

  update: async (
    id: string | number,
    row: HrmsRow,
  ) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.employmentStatus.update(id),
      rowToEmploymentStatusPayload(row),
    );

    return employmentStatusToRow(
      asEmploymentStatus(payload),
    );
  },

  remove: (
    id: string | number,
  ) =>
    apiClient.delete<{
      success?: boolean;
      message?: string;
      data?: null;
    }>(
      appendOrgIdQuery(API_ENDPOINTS.employmentStatus.delete(id)),
      {
        unwrap: false,
      },
    ),
};