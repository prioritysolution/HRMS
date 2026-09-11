import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  leaveApplicationStatusCode,
  leaveApplicationToRow,
} from "@/lib/api/services/leave-application.service";
import { branchService } from "@/lib/api/services/branch.service";
import { employeeService } from "@/lib/api/services/employee.service";
import type { LeaveApplicationListQuery, LeaveApplicationRecord } from "@/lib/api/types";
import type { HrmsRow } from "@/types/hrms";

export type LeaveApprovalDecisionPayload = {
  remarks?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): LeaveApplicationRecord[] {
  if (Array.isArray(payload)) return payload as LeaveApplicationRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as LeaveApplicationRecord[];
  return [];
}

function asSingle(payload: unknown): LeaveApplicationRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as LeaveApplicationRecord;
}

function withListQuery(basePath: string, query?: LeaveApplicationListQuery) {
  const params = new URLSearchParams();
  if (
    query &&
    Object.prototype.hasOwnProperty.call(query, "status") &&
    query.status !== undefined &&
    query.status !== null &&
    String(query.status) !== ""
  ) {
    params.set("status", String(query.status));
  }
  if (query?.leave_application_id !== undefined) {
    params.set("leave_application_id", String(query.leave_application_id));
  }
  if (query?.employee_id !== undefined) params.set("employee_id", String(query.employee_id));
  if (query?.leave_id !== undefined) params.set("leave_id", String(query.leave_id));
  if (query?.branch_id !== undefined) params.set("branch_id", String(query.branch_id));
  if (query?.from_date) params.set("from_date", query.from_date);
  if (query?.to_date) params.set("to_date", query.to_date);
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

function toApprovalRow(record: LeaveApplicationRecord): HrmsRow {
  const row = leaveApplicationToRow(record);
  const statusLabel = String(row.Application_status ?? row.Status ?? "Pending");
  return {
    ...row,
    Approval_status: statusLabel,
    Applied_on: String(row.Applied_on ?? row.From_date ?? ""),
  };
}

function enrichApprovalRow(
  row: HrmsRow,
  employeeById: Map<string, HrmsRow>,
  branchById: Map<string, string>,
): HrmsRow {
  const employeeId = String(row.Employee_id ?? "").trim();
  const employee = employeeId ? employeeById.get(employeeId) : undefined;
  const branchId = String(row.Branch_Id || employee?.Branch_Id || "").trim();
  const branchName = String(
    row.Branch_Name ||
      branchById.get(branchId) ||
      employee?.Branch_Name ||
      "",
  ).trim();

  const code = String(row.Employee_code || employee?.Employee_code || "").trim();
  const name = String(
    row.Employee_name || employee?.Display_name || employee?.Employee_name || "",
  ).trim();
  const designation = String(
    row.Designation || employee?.Designation || employee?.Desig_Name || "",
  ).trim();
  const photo = String(row.Photo_path || employee?.Photo_path || "").trim();

  return {
    ...row,
    Employee_code: code,
    Employee_name: name,
    Designation: designation,
    Branch_Id: branchId,
    Branch_Name: branchName || (branchId ? `Branch #${branchId}` : ""),
    Photo_path: photo,
  };
}

function sortApprovalRows(rows: HrmsRow[]): HrmsRow[] {
  return [...rows].sort((left, right) => {
    const leftBranchKey = String(left.Branch_Name || left.Branch_Id || "");
    const rightBranchKey = String(right.Branch_Name || right.Branch_Id || "");
    const branchCmp = leftBranchKey.localeCompare(rightBranchKey, undefined, {
      sensitivity: "base",
      numeric: true,
    });
    if (branchCmp !== 0) return branchCmp;

    const nameCmp = String(left.Employee_name ?? "").localeCompare(
      String(right.Employee_name ?? ""),
      undefined,
      { sensitivity: "base" },
    );
    if (nameCmp !== 0) return nameCmp;

    return String(left.Application_no ?? "").localeCompare(
      String(right.Application_no ?? ""),
      undefined,
      { numeric: true },
    );
  });
}

function assertPending(row: HrmsRow) {
  const code = leaveApplicationStatusCode(
    row.Application_status_code ?? row.Approval_status ?? row.Application_status ?? row.Status,
  );
  if (code !== 1) {
    throw new Error("Only pending leave applications can be approved or rejected.");
  }
}

function normalizeRemarks(remarks?: string, required = false): string {
  const text = String(remarks ?? "").trim().slice(0, 500);
  if (required && !text) {
    throw new Error("Rejection reason is required.");
  }
  return text;
}

export const leaveApprovalService = {
  list: async (query?: LeaveApplicationListQuery) => {
    const [payload, employees, branches] = await Promise.all([
      apiClient.get<unknown>(withListQuery(API_ENDPOINTS.leaveApproval.list, query)),
      employeeService.list({ status: 1 }).catch(() => [] as HrmsRow[]),
      branchService.list({ status: 1 }).catch(() => [] as HrmsRow[]),
    ]);

    const employeeById = new Map(
      employees
        .map((employee) => {
          const id = String(employee.Employee_id ?? employee.id ?? "").trim();
          return id ? ([id, employee] as const) : null;
        })
        .filter((entry): entry is readonly [string, HrmsRow] => entry !== null),
    );

    const branchById = new Map(
      branches
        .map((branch) => {
          const id = String(branch.Branch_Id ?? branch.id ?? "").trim();
          const name = String(branch.Branch_Name || branch.Branch_Code || "").trim();
          return id && name ? ([id, name] as const) : null;
        })
        .filter((entry): entry is readonly [string, string] => entry !== null),
    );

    return sortApprovalRows(
      asList(payload).map((record) =>
        enrichApprovalRow(toApprovalRow(record), employeeById, branchById),
      ),
    );
  },

  approve: async (id: string | number, remarks?: string, row?: HrmsRow) => {
    if (row) assertPending(row);
    const body: LeaveApprovalDecisionPayload = {};
    const note = normalizeRemarks(remarks, false);
    if (note) body.remarks = note;

    const payload = await apiClient.post<unknown>(API_ENDPOINTS.leaveApproval.approve(id), body);
    return toApprovalRow(asSingle(payload));
  },

  reject: async (id: string | number, remarks: string, row?: HrmsRow) => {
    if (row) assertPending(row);
    const note = normalizeRemarks(remarks, true);
    const payload = await apiClient.post<unknown>(API_ENDPOINTS.leaveApproval.reject(id), {
      remarks: note,
    });
    return toApprovalRow(asSingle(payload));
  },

  create: async () => {
    throw new Error("Leave approval records cannot be created from this screen.");
  },
  update: async () => {
    throw new Error("Use Approve or Reject actions instead of edit.");
  },
  remove: async () => {
    throw new Error("Leave approval records cannot be deleted from this screen.");
  },
};
