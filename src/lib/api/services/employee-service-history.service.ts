import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  EmployeeServiceHistoryListQuery,
  EmployeeServiceHistoryRecord,
  EmployeeServiceHistoryWritePayload,
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

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function asEmployeeServiceHistoryList(payload: unknown): EmployeeServiceHistoryRecord[] {
  if (Array.isArray(payload)) return payload as EmployeeServiceHistoryRecord[];

  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as EmployeeServiceHistoryRecord[];
  return [];
}

function asEmployeeServiceHistory(payload: unknown): EmployeeServiceHistoryRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as EmployeeServiceHistoryRecord;
}

export function employeeServiceHistoryToRow(record: EmployeeServiceHistoryRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;

  const historyId = readValue(source, ["History_id", "history_id", "History_Id", "id"]);
  const employeeId = readValue(source, ["Employee_id", "employee_id", "Employee_Id"]);
  const eventType = readValue(source, ["Event_type", "event_type", "Event_Type"]);
  const eventTypeName = optionalText(
    readValue(source, ["Event_type_name", "event_type_name", "Event_Type_Name"]),
  );
  const effectiveDate = optionalText(
    readValue(source, ["Effective_date", "effective_date", "Effective_Date"]),
  );

  const oldId = readValue(source, ["Old_Id", "old_id", "Old_id"]);
  const newId = readValue(source, ["New_Id", "new_id", "New_id"]);
  const oldDescription = optionalText(
    readValue(source, ["Old_Opt_Description", "old_opt_description", "Old_Opt_Description"]),
  );
  const newDescription = optionalText(
    readValue(source, ["New_Opt_Description", "new_opt_description", "New_Opt_Description"]),
  );
  const oldAmount = optionalNumber(readValue(source, ["Old_Amount", "old_amount", "Old_amount"]));
  const newAmount = optionalNumber(readValue(source, ["New_Amount", "new_amount", "New_amount"]));

  return {
    id: String(historyId ?? ""),
    History_id: Number(historyId ?? 0),
    Employee_id: Number(employeeId ?? 0),
    Employee_code:
      optionalText(readValue(source, ["Employee_code", "employee_code", "Employee_Code"])) ?? "",
    Employee_name:
      optionalText(readValue(source, ["Employee_name", "employee_name", "Employee_Name"])) ?? "",
    Event_type: eventTypeName ?? String(eventType ?? ""),
    Event_type_code: Number(eventType ?? 0),
    Effective_date: effectiveDate ? formatDateDisplay(effectiveDate) : "",
    Old_Id: optionalNumber(oldId),
    Old_value: oldDescription ?? "",
    New_Id: optionalNumber(newId),
    New_value: newDescription ?? "",
    Old_Amount: oldAmount ?? "",
    New_Amount: newAmount ?? "",
    Remarks: optionalText(readValue(source, ["Remarks", "remarks"])) ?? "",
    Created_by: optionalNumber(readValue(source, ["Created_by", "created_by"])),
    Created_at:
      optionalText(readValue(source, ["Created_at", "created_at", "Created_At"])) ?? "",
  };
}

export function rowToEmployeeServiceHistoryPayload(
  row: HrmsRow,
): EmployeeServiceHistoryWritePayload {
  const effectiveDateRaw = optionalText(row.Effective_date);
  const effectiveDate = effectiveDateRaw
    ? parseDateToIso(effectiveDateRaw) || effectiveDateRaw
    : "";

  const employeeId = Number(row.Employee_id ?? 0);
  const eventType = Number(row.Event_type_code ?? row.Event_type ?? 0);

  if (!Number.isFinite(employeeId) || employeeId <= 0) {
    throw new Error("Employee is required.");
  }

  if (!Number.isFinite(eventType) || eventType <= 0) {
    throw new Error("Event type is required.");
  }

  if (!effectiveDate) {
    throw new Error("Effective date is required.");
  }

  const oldId = optionalNumber(row.Old_Id);
  const newId = optionalNumber(row.New_Id);
  const oldAmount = optionalNumber(row.Old_Amount);
  const newAmount = optionalNumber(row.New_Amount);

  return {
    employee_id: employeeId,
    event_type: eventType,
    effective_date: effectiveDate,
    ...(oldId !== null ? { old_id: oldId, old_opt_code: oldId } : {}),
    ...(newId !== null ? { new_id: newId, new_opt_code: newId } : {}),
    ...(oldAmount !== null ? { old_amount: oldAmount } : {}),
    ...(newAmount !== null ? { new_amount: newAmount } : {}),
    remarks: optionalText(row.Remarks),
  };
}

function withListQuery(basePath: string, query?: EmployeeServiceHistoryListQuery) {
  const params = new URLSearchParams();

  if (query?.history_id !== undefined) {
    params.set("history_id", String(query.history_id));
  }
  if (query?.employee_id !== undefined) {
    params.set("employee_id", String(query.employee_id));
  }
  if (query?.event_type !== undefined) {
    params.set("event_type", String(query.event_type));
  }
  if (query?.effective_date) {
    params.set("effective_date", query.effective_date);
  }

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export const employeeServiceHistoryService = {
  list: async (query?: EmployeeServiceHistoryListQuery) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.employeeServiceHistory.list, query),
    );
    return asEmployeeServiceHistoryList(payload).map(employeeServiceHistoryToRow);
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.employeeServiceHistory.create,
      rowToEmployeeServiceHistoryPayload(row),
    );
    return employeeServiceHistoryToRow(asEmployeeServiceHistory(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.employeeServiceHistory.update(id),
      rowToEmployeeServiceHistoryPayload(row),
    );
    return employeeServiceHistoryToRow(asEmployeeServiceHistory(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{
      success?: boolean;
      message?: string;
      data?: null;
    }>(API_ENDPOINTS.employeeServiceHistory.delete(id), {
      unwrap: false,
    }),
};
