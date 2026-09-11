import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { countLeaveDays } from "@/lib/leave-module-utils";
import { formatDateDisplay, parseDateToIso } from "@/lib/date-utils";
import { getApiUrl } from "@/lib/env";
import type {
  LeaveApplicationListQuery,
  LeaveApplicationRecord,
  LeaveApplicationStatusCode,
  LeaveApplicationStatusPayload,
  LeaveApplicationWritePayload,
  LeaveBalanceQuery,
  LeaveBalanceRecord,
  LeaveHalfDayCode,
} from "@/lib/api/types";
import type { HrmsRow } from "@/types/hrms";

/** Appl-options Opt_Grp_Id = 16 — Application Status */
export const LEAVE_APP_STATUS_OPT_GRP_ID = 16;
/** Appl-options Opt_Grp_Id = 19 — Half Day */
export const LEAVE_HALF_DAY_OPT_GRP_ID = 19;

export const LEAVE_APP_STATUS_FALLBACK = [
  { value: "1", label: "Pending" },
  { value: "2", label: "Approved" },
  { value: "3", label: "Rejected" },
  { value: "4", label: "Cancelled" },
] as const;

export const LEAVE_HALF_DAY_FALLBACK = [
  { value: "1", label: "First Half" },
  { value: "2", label: "Second Half" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  "1": "Pending",
  "2": "Approved",
  "3": "Rejected",
  "4": "Cancelled",
};

const HALF_DAY_LABEL: Record<string, string> = {
  "1": "First Half",
  "2": "Second Half",
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
  return 0;
}

function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as T[];
  return [];
}

function asSingle<T>(payload: unknown): T {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as T;
}

function withQuery(basePath: string, entries: Array<[string, string | number | undefined]>) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function leaveApplicationStatusLabel(value: unknown): string {
  const text = optionalText(value);
  if (!text) return "Pending";
  if (STATUS_LABEL[text]) return STATUS_LABEL[text];
  const normalized = text.toLowerCase();
  if (normalized.includes("approve")) return "Approved";
  if (normalized.includes("reject")) return "Rejected";
  if (normalized.includes("cancel")) return "Cancelled";
  if (normalized.includes("pend")) return "Pending";
  return text;
}

export function leaveApplicationStatusCode(value: unknown): LeaveApplicationStatusCode {
  const text = optionalText(value);
  if (text === "1" || text === "2" || text === "3" || text === "4") {
    return Number(text) as LeaveApplicationStatusCode;
  }
  const label = leaveApplicationStatusLabel(value).toLowerCase();
  if (label === "approved") return 2;
  if (label === "rejected") return 3;
  if (label === "cancelled") return 4;
  return 1;
}

export function halfDayLabel(value: unknown): string {
  const text = optionalText(value);
  if (!text) return "";
  if (HALF_DAY_LABEL[text]) return HALF_DAY_LABEL[text];
  const normalized = text.toLowerCase();
  if (normalized.includes("second")) return "Second Half";
  if (normalized.includes("first")) return "First Half";
  return text;
}

export function halfDayCode(value: unknown): LeaveHalfDayCode | undefined {
  const text = optionalText(value);
  if (!text) return undefined;
  if (text === "1" || text === "2") return Number(text) as LeaveHalfDayCode;
  const normalized = text.toLowerCase();
  if (normalized.includes("second")) return 2;
  if (normalized.includes("first")) return 1;
  return undefined;
}

export function computeLeaveApplicationDays(
  fromDate: string,
  toDate: string,
  halfDay?: unknown,
): number {
  const dayCount = countLeaveDays(fromDate, toDate);
  if (!dayCount) return 0;
  const half = halfDayCode(halfDay) ?? (optionalText(halfDay) ? 1 : undefined);
  if (half && dayCount === 1) return 0.5;
  return dayCount;
}

export function leaveBalanceToOption(record: LeaveBalanceRecord) {
  const source = record as unknown as Record<string, unknown>;
  const leaveId = optionalNumber(readValue(source, ["Leave_Id", "leave_id"]));
  const name = optionalText(readValue(source, ["Leave_Name", "leave_name"]));
  const code = optionalText(readValue(source, ["Leave_Code", "leave_code"]));
  const balance =
    optionalNumber(readValue(source, ["Balance_Days", "balance_days"])) ?? 0;
  if (!leaveId) return null;
  return {
    value: String(leaveId),
    label: code ? `${name || code} (${code}) · Bal ${balance}` : `${name} · Bal ${balance}`,
    balance,
    requiresDocument: toFlag(readValue(source, ["Requires_Document", "requires_document"]), 0) === 1,
    halfDayAllowed: toFlag(readValue(source, ["Is_Half_Day_Allowed", "is_half_day_allowed"]), 1) === 1,
    leaveName: name,
    leaveCode: code,
  };
}

export function leaveBalanceToRow(record: LeaveBalanceRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const leaveId = optionalNumber(readValue(source, ["Leave_Id", "leave_id"])) ?? 0;
  const balance =
    optionalNumber(readValue(source, ["Balance_Days", "balance_days"])) ?? 0;
  const requiresDocument = toFlag(
    readValue(source, ["Requires_Document", "requires_document"]),
    0,
  );

  return {
    id: String(leaveId),
    Leave_Id: leaveId,
    Leave_code: optionalText(readValue(source, ["Leave_Code", "leave_code"])),
    Leave_name: optionalText(readValue(source, ["Leave_Name", "leave_name"])),
    Balance_leave: balance,
    Balance_Days: balance,
    Is_half_day_allowed: toFlag(
      readValue(source, ["Is_Half_Day_Allowed", "is_half_day_allowed"]),
      1,
    ),
    Requires_document: requiresDocument === 1 ? "Yes" : "No",
    Document_required: requiresDocument === 1 ? "Yes" : "No",
  };
}

function resolveDocumentUrl(
  employeeId: number,
  filename: string,
  explicitUrl?: string,
): string {
  if (explicitUrl) {
    if (/^(https?:|blob:|data:)/i.test(explicitUrl)) return explicitUrl;
    return getApiUrl(explicitUrl.startsWith("/") ? explicitUrl : `/${explicitUrl}`);
  }
  if (!employeeId || !filename) return "";
  return getApiUrl(API_ENDPOINTS.leaveApplication.file(employeeId, filename));
}

export function leaveApplicationToRow(record: LeaveApplicationRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const id = optionalNumber(
    readValue(source, ["Leave_Application_Id", "leave_application_id", "id"]),
  );
  const employeeId =
    optionalNumber(readValue(source, ["Employee_Id", "employee_id"])) ?? 0;
  const leaveId = optionalNumber(readValue(source, ["Leave_Id", "leave_id"])) ?? 0;
  const branchId = optionalNumber(readValue(source, ["Branch_Id", "branch_id"]));
  const fromDateRaw = optionalText(readValue(source, ["From_Date", "from_date"]));
  const toDateRaw = optionalText(readValue(source, ["To_Date", "to_date"]));
  const statusFromApi = optionalText(
    readValue(source, ["Status_Name", "status_name", "Application_status"]),
  );
  const statusCode = leaveApplicationStatusCode(
    readValue(source, ["Status", "status", "Status_Name", "status_name"]),
  );
  const statusLabel = statusFromApi || leaveApplicationStatusLabel(statusCode);
  const half = halfDayCode(readValue(source, ["Half_Day", "half_day"]));
  const halfDayName = optionalText(
    readValue(source, ["Half_Day_Name", "half_day_name"]),
  );
  const documentFile = optionalText(
    readValue(source, ["Document_File", "document_file", "Document_name"]),
  );
  const documentUrl = optionalText(readValue(source, ["Document_Url", "document_url"]));
  const totalDays =
    optionalNumber(
      readValue(source, ["Total_Days", "total_days", "No_Of_Days", "no_of_days"]),
    ) ?? computeLeaveApplicationDays(fromDateRaw, toDateRaw, half);
  const leaveCode = optionalText(readValue(source, ["Leave_Code", "leave_code"]));
  const leaveName = optionalText(readValue(source, ["Leave_Name", "leave_name"]));
  const appliedRaw = optionalText(
    readValue(source, ["Applied_Date", "applied_date", "Applied_on", "applied_on", "Created_at"]),
  );
  const leaveLabel =
    leaveId && leaveCode
      ? `${leaveId} - ${leaveCode}`
      : leaveCode || (leaveId ? String(leaveId) : leaveName);
  const requiresDocument = toFlag(
    readValue(source, ["Requires_Document", "requires_document", "Requires_document"]),
    0,
  );

  return {
    id: String(id ?? ""),
    Leave_Application_Id: id ?? 0,
    Application_no: optionalText(readValue(source, ["Application_No", "application_no"])),
    Employee_id: employeeId ? String(employeeId) : "",
    Employee_code: optionalText(
      readValue(source, ["Employee_Code", "Employee_code", "employee_code"]),
    ),
    Employee_name: optionalText(
      readValue(source, [
        "Employee_Name",
        "Employee_name",
        "employee_name",
        "Emp_Name",
        "emp_name",
        "Display_name",
        "display_name",
      ]),
    ),
    Designation: optionalText(
      readValue(source, [
        "Designation",
        "designation",
        "Desig_Name",
        "desig_name",
        "Post",
        "post",
        "Post_Name",
        "post_name",
      ]),
    ),
    Photo_path: optionalText(
      readValue(source, ["Photo_path", "photo_path", "Photo", "photo", "Emp_Photo"]),
    ),
    Branch_Id: branchId == null ? "" : String(branchId),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Leave_id: leaveId ? String(leaveId) : "",
    Leave_type: leaveName,
    Leave_name: leaveName,
    Leave_code: leaveCode,
    Leave_label: leaveLabel,
    Requires_document: requiresDocument === 1 ? "Yes" : "No",
    Requires_Document: requiresDocument,
    From_date: fromDateRaw ? formatDateDisplay(fromDateRaw) || fromDateRaw : "",
    To_date: toDateRaw ? formatDateDisplay(toDateRaw) || toDateRaw : "",
    Number_of_days: totalDays,
    Half_day: half ? String(half) : "",
    Half_day_label: halfDayName || (half ? halfDayLabel(half) : ""),
    Reason: optionalText(
      readValue(source, ["Reason", "reason", "Leave_Reason", "leave_reason"]),
    ),
    Document_name: documentFile,
    Document_Url: resolveDocumentUrl(employeeId, documentFile, documentUrl),
    Supporting_document_preview: resolveDocumentUrl(employeeId, documentFile, documentUrl),
    Application_status: statusLabel,
    Application_status_code: statusCode,
    Status: statusLabel,
    Applied_on: appliedRaw
      ? formatDateDisplay(appliedRaw.slice(0, 10)) || appliedRaw
      : "",
    Remarks: optionalText(readValue(source, ["Remarks", "remarks"])),
  };
}

function getAttachmentFile(row: HrmsRow): File | null {
  const file = row.Supporting_document ?? row.attachment;
  return file instanceof File ? file : null;
}

export function rowToLeaveApplicationPayload(row: HrmsRow): LeaveApplicationWritePayload {
  const employeeId = optionalNumber(row.Employee_id ?? row.Employee_Id);
  const leaveId = optionalNumber(row.Leave_id ?? row.Leave_Id);
  if (!employeeId || employeeId <= 0) {
    throw new Error("Employee is required.");
  }
  if (!leaveId || leaveId <= 0) {
    throw new Error("Leave type is required.");
  }

  const fromDate = parseDateToIso(String(row.From_date ?? "")) || String(row.From_date ?? "").trim();
  const toDate = parseDateToIso(String(row.To_date ?? "")) || String(row.To_date ?? "").trim();
  if (!fromDate || !toDate) {
    throw new Error("Leave from and leave to dates are required.");
  }

  const half = halfDayCode(row.Half_day);
  const totalDays =
    optionalNumber(row.Number_of_days) ??
    computeLeaveApplicationDays(String(row.From_date ?? ""), String(row.To_date ?? ""), half);

  const payload: LeaveApplicationWritePayload = {
    employee_id: employeeId,
    leave_id: leaveId,
    from_date: fromDate,
    to_date: toDate,
    total_days: totalDays,
    reason: optionalText(row.Reason).slice(0, 500) || undefined,
  };

  if (half) payload.half_day = half;

  const applicationNo = optionalText(row.Application_no);
  if (applicationNo) payload.application_no = applicationNo;

  return payload;
}

function toLeaveApplicationFormData(row: HrmsRow): FormData {
  const payload = rowToLeaveApplicationPayload(row);
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  });

  const file = getAttachmentFile(row);
  if (file) {
    formData.append("attachment", file, file.name);
  }

  return formData;
}

export const leaveApplicationService = {
  list: async (query?: LeaveApplicationListQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.leaveApplication.list, [
        ["leave_application_id", query?.leave_application_id],
        ["employee_id", query?.employee_id],
        ["leave_id", query?.leave_id],
        ["branch_id", query?.branch_id],
        ["status", query?.status],
        ["from_date", query?.from_date],
        ["to_date", query?.to_date],
      ]),
    );
    return asList<LeaveApplicationRecord>(payload).map(leaveApplicationToRow);
  },

  balance: async (query: LeaveBalanceQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.leaveApplication.balance, [
        ["employee_id", query.employee_id],
        ["fin_year", query.fin_year],
        ["leave_id", query.leave_id],
      ]),
    );
    return asList<LeaveBalanceRecord>(payload).map(leaveBalanceToRow);
  },

  getById: async (id: string | number) => {
    const rows = await leaveApplicationService.list({
      leave_application_id: Number(id),
    });
    return rows[0];
  },

  create: async (row: HrmsRow) => {
    const hasFile = Boolean(getAttachmentFile(row));
    const body = hasFile ? toLeaveApplicationFormData(row) : rowToLeaveApplicationPayload(row);
    const payload = await apiClient.post<unknown>(API_ENDPOINTS.leaveApplication.create, body);
    return leaveApplicationToRow(asSingle<LeaveApplicationRecord>(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const statusCode = leaveApplicationStatusCode(
      row.Application_status_code ?? row.Application_status ?? row.Status,
    );
    if (statusCode !== 1) {
      throw new Error("Only pending leave requisitions can be updated.");
    }

    if (getAttachmentFile(row)) {
      const formData = toLeaveApplicationFormData(row);
      formData.append("_method", "PUT");
      const payload = await apiClient.post<unknown>(
        API_ENDPOINTS.leaveApplication.update(id),
        formData,
      );
      return leaveApplicationToRow(asSingle<LeaveApplicationRecord>(payload));
    }

    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.leaveApplication.update(id),
      rowToLeaveApplicationPayload(row),
    );
    return leaveApplicationToRow(asSingle<LeaveApplicationRecord>(payload));
  },

  updateStatus: async (
    id: string | number,
    status: LeaveApplicationStatusCode,
    remarks?: string,
  ) => {
    const body: LeaveApplicationStatusPayload = { status };
    if (remarks) body.remarks = remarks;
    const payload = await apiClient.put<unknown>(API_ENDPOINTS.leaveApplication.status(id), body);
    return leaveApplicationToRow(asSingle<LeaveApplicationRecord>(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.leaveApplication.delete(id),
      { unwrap: false },
    ),
};
