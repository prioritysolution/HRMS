import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  LeaveMasterGender,
  LeaveMasterListQuery,
  LeaveMasterRecord,
  LeaveMasterStatusPayload,
  LeaveMasterWritePayload,
} from "@/lib/api/types";
import {
  toOrganizationStatus,
  toOrganizationStatusLabel,
} from "@/lib/api/services/organization.service";
import type { HrmsRow } from "@/types/hrms";

/** Appl-options Opt_Grp_Id = 18 */
export const LEAVE_VALIDITY_OPT_GRP_ID = 18;

export const LEAVE_VALIDITY_FALLBACK_OPTIONS = [
  { value: "1", label: "Within Year" },
  { value: "2", label: "Within Days" },
  { value: "3", label: "Carry Forwarded" },
] as const;

export const LEAVE_GENDER_OPTIONS = [
  { value: "A", label: "All" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
] as const;

const VALIDITY_LABEL_BY_CODE: Record<string, string> = {
  "1": "Within Year",
  "2": "Within Days",
  "3": "Carry Forwarded",
};

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

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toFlag(value: unknown, defaultValue: 0 | 1 = 0): 0 | 1 {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (value === true || value === "true" || value === 1 || value === "1" || value === "Yes") {
    return 1;
  }
  if (value === false || value === "false" || value === 0 || value === "0" || value === "No") {
    return 0;
  }
  const num = Number(value);
  return num === 1 ? 1 : 0;
}

function toYesNo(value: unknown): "Yes" | "No" {
  return toFlag(value, 0) === 1 ? "Yes" : "No";
}

function toApplicableGender(value: unknown): LeaveMasterGender {
  const raw = optionalText(value).toUpperCase();
  if (raw === "M" || raw === "MALE") return "M";
  if (raw === "F" || raw === "FEMALE") return "F";
  return "A";
}

function genderLabel(code: LeaveMasterGender): string {
  if (code === "M") return "Male";
  if (code === "F") return "Female";
  return "All";
}

function resolveValidityCode(value: unknown): number {
  const text = optionalText(value);
  if (!text) return 1;

  const asNum = Number(text);
  if (asNum === 1 || asNum === 2 || asNum === 3) return asNum;

  const normalized = text.toLowerCase();
  if (normalized.includes("carry")) return 3;
  if (normalized.includes("day")) return 2;
  return 1;
}

function validityLabel(code: number, fallback?: unknown): string {
  return (
    VALIDITY_LABEL_BY_CODE[String(code)] ||
    optionalText(fallback) ||
    VALIDITY_LABEL_BY_CODE["1"]
  );
}

function asLeaveMasterList(payload: unknown): LeaveMasterRecord[] {
  if (Array.isArray(payload)) return payload as LeaveMasterRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as LeaveMasterRecord[];
  return [];
}

function asLeaveMaster(payload: unknown): LeaveMasterRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as LeaveMasterRecord;
}

function withListQuery(basePath: string, query?: LeaveMasterListQuery) {
  const params = new URLSearchParams();
  if (query?.leave_id !== undefined) params.set("leave_id", String(query.leave_id));
  if (query?.leave_code) params.set("leave_code", query.leave_code);
  if (query?.status !== undefined) params.set("status", String(query.status));
  if (query?.applicable_gender) params.set("applicable_gender", query.applicable_gender);
  if (query?.applicable_employee_type !== undefined) {
    params.set("applicable_employee_type", String(query.applicable_employee_type));
  }
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function leaveMasterToRow(record: LeaveMasterRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const leaveId = readValue(source, ["Leave_Id", "leave_id", "id"]);
  const leaveCode = optionalText(readValue(source, ["Leave_Code", "leave_code"]));
  const leaveName = optionalText(readValue(source, ["Leave_Name", "leave_name"]));
  const leaveDays = optionalNumber(readValue(source, ["Leave_Days", "leave_days"])) ?? 0;
  const requiresDocument = toYesNo(
    readValue(source, ["Requires_Document", "requires_document", "Document_required"]),
  );
  const validityCode = resolveValidityCode(
    readValue(source, ["Validity", "validity", "Validity_code"]),
  );
  const daysNumber =
    optionalNumber(readValue(source, ["Days_Number", "days_number"])) ??
    optionalNumber(readValue(source, ["Max_Carry_Forward_Days", "max_carry_forward_days"])) ??
    0;
  const gender = toApplicableGender(
    readValue(source, ["Applicable_Gender", "applicable_gender"]),
  );
  const empType = optionalNumber(
    readValue(source, ["Applicable_Employee_Type", "applicable_employee_type"]),
  );
  const statusLabel = toOrganizationStatusLabel(readValue(source, ["Status", "status"]));

  return {
    id: String(leaveId ?? ""),
    Leave_Id: Number(leaveId ?? 0),
    Leave_code: leaveCode,
    Short_name: leaveCode,
    Leave_name: leaveName,
    Leave_days: leaveDays,
    Leaves_per_year: leaveDays,
    Is_paid: toFlag(readValue(source, ["Is_Paid", "is_paid"]), 1),
    Is_half_day_allowed: toFlag(
      readValue(source, ["Is_Half_Day_Allowed", "is_half_day_allowed"]),
      1,
    ),
    Is_carry_forward: toFlag(
      readValue(source, ["Is_Carry_Forward", "is_carry_forward"]),
      validityCode === 3 ? 1 : 0,
    ),
    Max_carry_forward_days:
      optionalNumber(
        readValue(source, ["Max_Carry_Forward_Days", "max_carry_forward_days"]),
      ) ?? 0,
    Is_encashable: toFlag(readValue(source, ["Is_Encashable", "is_encashable"]), 0),
    Max_encash_days:
      optionalNumber(readValue(source, ["Max_Encash_Days", "max_encash_days"])) ?? 0,
    Requires_approval: toFlag(
      readValue(source, ["Requires_Approval", "requires_approval"]),
      1,
    ),
    Requires_document: requiresDocument,
    Document_required: requiresDocument,
    Minimum_days:
      optionalNumber(readValue(source, ["Minimum_Days", "minimum_days"])) ?? 1,
    Maximum_days: optionalNumber(readValue(source, ["Maximum_Days", "maximum_days"])),
    Applicable_gender: gender,
    Applicable_gender_label: genderLabel(gender),
    Applicable_employee_type: empType == null ? "" : String(empType),
    Validity: String(validityCode),
    Validity_label: validityLabel(
      validityCode,
      readValue(source, ["Validity_Description", "validity_description"]),
    ),
    Days_number: daysNumber,
    Status: statusLabel,
    Is_active: statusLabel === "Active",
  };
}

export function rowToLeaveMasterPayload(
  row: HrmsRow,
  options?: { requireLeaveCode?: boolean },
): LeaveMasterWritePayload {
  const leaveCode = optionalText(row.Leave_code ?? row.Short_name).toUpperCase();
  const validityCode = resolveValidityCode(row.Validity ?? row.Validity_code);
  const isCarryForward =
    toFlag(row.Is_carry_forward, validityCode === 3 ? 1 : 0) === 1 || validityCode === 3
      ? 1
      : 0;
  const daysNumber = optionalNumber(row.Days_number) ?? 0;
  const maxCarry =
    optionalNumber(row.Max_carry_forward_days) ??
    (isCarryForward === 1 ? daysNumber : 0);
  const empTypeRaw = optionalText(row.Applicable_employee_type);
  const empType = empTypeRaw ? Number(empTypeRaw) : null;

  const payload: LeaveMasterWritePayload = {
    leave_name: optionalText(row.Leave_name),
    leave_days: optionalNumber(row.Leave_days ?? row.Leaves_per_year) ?? 0,
    is_paid: toFlag(row.Is_paid, 1),
    is_half_day_allowed: toFlag(row.Is_half_day_allowed, 1),
    is_carry_forward: isCarryForward,
    max_carry_forward_days: maxCarry,
    is_encashable: toFlag(row.Is_encashable, 0),
    max_encash_days: optionalNumber(row.Max_encash_days) ?? 0,
    requires_approval: toFlag(row.Requires_approval, 1),
    requires_document: toFlag(row.Requires_document ?? row.Document_required, 0),
    minimum_days: optionalNumber(row.Minimum_days) ?? 1,
    maximum_days: optionalNumber(row.Maximum_days),
    applicable_gender: toApplicableGender(row.Applicable_gender),
    applicable_employee_type:
      empType !== null && Number.isFinite(empType) && empType > 0 ? empType : null,
    validity: validityCode,
    days_number: daysNumber,
    status: toOrganizationStatus(row.Status ?? row.Is_active),
  };

  if (options?.requireLeaveCode && !leaveCode) {
    throw new Error("Leave code is required to update a leave type.");
  }
  if (leaveCode) {
    payload.leave_code = leaveCode;
  }

  return payload;
}

export const leaveMasterService = {
  list: async (query?: LeaveMasterListQuery) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.leaveMaster.list, query),
    );
    return asLeaveMasterList(payload).map(leaveMasterToRow);
  },

  getById: async (id: string | number) => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.leaveMaster.list, { leave_id: Number(id) }),
    );
    const rows = asLeaveMasterList(payload).map(leaveMasterToRow);
    return rows[0] ?? leaveMasterToRow(asLeaveMaster(payload));
  },

  create: async (row: HrmsRow) => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.leaveMaster.create,
      rowToLeaveMasterPayload(row),
    );
    return leaveMasterToRow(asLeaveMaster(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.leaveMaster.update(id),
      rowToLeaveMasterPayload(row, { requireLeaveCode: true }),
    );
    return leaveMasterToRow(asLeaveMaster(payload));
  },

  updateStatus: async (id: string | number, status: 0 | 1) => {
    const body: LeaveMasterStatusPayload = { status };
    const payload = await apiClient.put<unknown>(API_ENDPOINTS.leaveMaster.status(id), body);
    return leaveMasterToRow(asLeaveMaster(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.leaveMaster.delete(id),
      { unwrap: false },
    ),
};
