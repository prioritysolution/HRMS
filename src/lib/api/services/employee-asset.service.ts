import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  EmployeeAssetListQuery,
  EmployeeAssetRecord,
  EmployeeAssetWritePayload,
} from "@/lib/api/types";
import { formatDateDisplay, parseDateToIso } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === false) return null;
  const text = String(value).trim();
  return text || null;
}

function asEmployeeAssetList(payload: unknown): EmployeeAssetRecord[] {
  if (Array.isArray(payload)) return payload as EmployeeAssetRecord[];

  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as EmployeeAssetRecord[];
  return [];
}

function asEmployeeAsset(payload: unknown): EmployeeAssetRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as EmployeeAssetRecord;
}

function allocationStatusLabel(
  status: unknown,
  returnDate: string | null,
): "Allocated" | "Returned" {
  if (returnDate) return "Returned";

  const numericStatus = Number(status);
  if (numericStatus === 0) return "Returned";

  return "Allocated";
}

export function employeeAssetToRow(record: EmployeeAssetRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;

  const assignmentId = readValue(source, [
    "Assignment_id",
    "assignment_id",
    "Assignment_Id",
    "id",
  ]);

  const employeeId = readValue(source, ["Employee_id", "employee_id", "Employee_Id"]);
  const assetId = readValue(source, ["Asset_id", "asset_id", "Asset_Id"]);

  const issueDate = optionalText(
    readValue(source, ["Issue_date", "issue_date", "Issue_Date"]),
  );
  const returnDate = optionalText(
    readValue(source, ["Return_date", "return_date", "Return_Date"]),
  );

  const status = readValue(source, ["Status", "status"]);
  const assetTypeName = optionalText(
    readValue(source, ["Asset_type_name", "asset_type_name", "Asset_Type_Name"]),
  );
  const assetCode = optionalText(
    readValue(source, ["Asset_code", "asset_code", "Asset_Code"]),
  );

  return {
    id: String(assignmentId ?? ""),
    Assignment_id: Number(assignmentId ?? 0),
    Employee_id: Number(employeeId ?? 0),
    Employee_code: optionalText(
      readValue(source, ["Employee_code", "employee_code", "Employee_Code"]),
    ) ?? "",
    Employee_name: optionalText(
      readValue(source, ["Employee_name", "employee_name", "Employee_Name"]),
    ) ?? "",
    Asset_id: Number(assetId ?? 0),
    Asset_code: assetCode ?? "",
    Asset_name: assetTypeName ?? assetCode ?? "",
    Asset_type: assetTypeName ?? "",
    Serial_number: optionalText(
      readValue(source, ["Serial_number", "serial_number", "Serial_Number"]),
    ) ?? "",
    Allocation_date: issueDate ? formatDateDisplay(issueDate) : "",
    Return_date: returnDate ? formatDateDisplay(returnDate) : "",
    Condition: optionalText(
      readValue(source, ["Issue_condition", "issue_condition", "Issue_Condition"]),
    ) ?? "",
    Return_condition: optionalText(
      readValue(source, ["Return_condition", "return_condition", "Return_Condition"]),
    ) ?? "",
    Allocation_status: allocationStatusLabel(status, returnDate),
    Status: Number(status ?? 1),
    Remarks: optionalText(readValue(source, ["Remarks", "remarks"])) ?? "",
  };
}

export function rowToEmployeeAssetPayload(row: HrmsRow): EmployeeAssetWritePayload {
  const issueDateRaw = optionalText(row.Allocation_date);
  const returnDateRaw = optionalText(row.Return_date);
  const allocationStatus = String(row.Allocation_status ?? "Allocated")
    .trim()
    .toLowerCase();

  const issueDate = issueDateRaw
    ? parseDateToIso(issueDateRaw) || issueDateRaw
    : "";

  const returnDate =
    allocationStatus === "returned" || returnDateRaw
      ? returnDateRaw
        ? parseDateToIso(returnDateRaw) || returnDateRaw
        : null
      : null;

  const employeeId = Number(row.Employee_id ?? 0);
  const assetId = Number(row.Asset_id ?? 0);

  if (!Number.isFinite(employeeId) || employeeId <= 0) {
    throw new Error("Employee is required.");
  }

  if (!Number.isFinite(assetId) || assetId <= 0) {
    throw new Error("Asset is required.");
  }

  if (!issueDate) {
    throw new Error("Allocation date is required.");
  }

  return {
    employee_id: employeeId,
    asset_id: assetId,
    issue_date: issueDate,
    return_date: returnDate,
    issue_condition: optionalText(row.Condition),
    return_condition: optionalText(row.Return_condition),
    status: 1,
    remarks: optionalText(row.Remarks),
  };
}

function withListQuery(basePath: string, query?: EmployeeAssetListQuery) {
  const params = new URLSearchParams();

  if (query?.assignment_id !== undefined) {
    params.set("assignment_id", String(query.assignment_id));
  }
  if (query?.employee_id !== undefined) {
    params.set("employee_id", String(query.employee_id));
  }
  if (query?.asset_id !== undefined) {
    params.set("asset_id", String(query.asset_id));
  }
  if (query?.status !== undefined) {
    params.set("status", String(query.status));
  }

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const employeeAssetService = {
  list: async (query?: EmployeeAssetListQuery) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.employeeAsset.list, query),
    );
    return asEmployeeAssetList(payload).map(employeeAssetToRow);
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.employeeAsset.create,
      rowToEmployeeAssetPayload(row),
    );
    return employeeAssetToRow(asEmployeeAsset(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.employeeAsset.update(id),
      rowToEmployeeAssetPayload(row),
    );
    return employeeAssetToRow(asEmployeeAsset(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{
      success?: boolean;
      message?: string;
      data?: null;
    }>(API_ENDPOINTS.employeeAsset.delete(id), {
      unwrap: false,
    }),
};
