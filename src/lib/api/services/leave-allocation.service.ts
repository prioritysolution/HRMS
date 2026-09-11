import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { branchService } from "@/lib/api/services/branch.service";
import { employeeService } from "@/lib/api/services/employee.service";
import { finYearService } from "@/lib/api/services/fin-year.service";
import { leaveMasterService } from "@/lib/api/services/leave-master.service";
import type {
  LeaveAllocationCreatePayload,
  LeaveAllocationLeavePayload,
  LeaveAllocationListQuery,
  LeaveAllocationRecord,
  LeaveAllocationUpdatePayload,
} from "@/lib/api/types";
import { toOrganizationStatusLabel } from "@/lib/api/services/organization.service";
import type { HrmsRow } from "@/types/hrms";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(payload: unknown): LeaveAllocationRecord[] {
  if (Array.isArray(payload)) return payload as LeaveAllocationRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as LeaveAllocationRecord[];
  return [];
}

function asSingle(payload: unknown): LeaveAllocationRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  if (Array.isArray(record?.data) && record.data.length > 0) {
    return record.data[0] as LeaveAllocationRecord;
  }
  return (nested ?? record ?? payload) as LeaveAllocationRecord;
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

function toDays(value: unknown, fallback = 0): number {
  const num = optionalNumber(value);
  return num == null ? fallback : Math.max(0, num);
}

function withListQuery(basePath: string, query?: LeaveAllocationListQuery) {
  const params = new URLSearchParams();
  if (query?.employee_leave_id !== undefined) {
    params.set("employee_leave_id", String(query.employee_leave_id));
  }
  if (query?.employee_id !== undefined) params.set("employee_id", String(query.employee_id));
  if (query?.leave_id !== undefined) params.set("leave_id", String(query.leave_id));
  const finYear = query?.fin_year ?? query?.year_id;
  if (finYear !== undefined) params.set("fin_year", String(finYear));
  if (query?.status !== undefined && query.status !== null && String(query.status) !== "") {
    params.set("status", String(query.status));
  }
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function leaveAllocationToRow(record: LeaveAllocationRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const id =
    optionalNumber(
      readValue(source, ["Employee_Leave_Id", "employee_leave_id", "id"]),
    ) ?? 0;
  const employeeId =
    optionalNumber(readValue(source, ["Employee_Id", "employee_id"])) ?? 0;
  const leaveId = optionalNumber(readValue(source, ["Leave_Id", "leave_id"])) ?? 0;
  const yearId =
    optionalNumber(
      readValue(source, ["Year_Id", "year_id", "Fin_Year", "fin_year"]),
    ) ?? 0;
  const allocated = toDays(
    readValue(source, ["Allocated_Days", "allocated_days", "Allocation"]),
  );
  const opening = toDays(readValue(source, ["Opening_Balance", "opening_balance"]));
  const earned = toDays(readValue(source, ["Earned_Days", "earned_days"]));
  const carry = toDays(
    readValue(source, ["Carry_Forward_Days", "carry_forward_days"]),
  );
  const used = toDays(readValue(source, ["Used_Days", "used_days"]));
  const leaveCode = optionalText(readValue(source, ["Leave_Code", "leave_code"]));
  const leaveName = optionalText(
    readValue(source, ["Leave_Name", "leave_name", "Leave_type", "leave_type"]),
  );
  const yearName = optionalText(
    readValue(source, ["Year_Name", "year_name", "Financial_year", "financial_year"]),
  );
  const statusRaw = readValue(source, ["Status", "status"]);

  return {
    id: String(id || `${employeeId}-${leaveId}-${yearId}`),
    Employee_Leave_Id: id,
    Employee_id: employeeId ? String(employeeId) : "",
    Employee_code: optionalText(
      readValue(source, ["Employee_Code", "Employee_code", "employee_code"]),
    ),
    Employee_name: optionalText(
      readValue(source, [
        "Employee_Name",
        "Employee_name",
        "employee_name",
        "Display_name",
      ]),
    ),
    Photo_path: optionalText(
      readValue(source, ["Photo_path", "photo_path", "Photo", "photo"]),
    ),
    Branch_Id: optionalText(readValue(source, ["Branch_Id", "branch_id"])),
    Branch_Name: optionalText(readValue(source, ["Branch_Name", "branch_name"])),
    Leave_id: leaveId ? String(leaveId) : "",
    Leave_code: leaveCode,
    Leave_type: leaveName || leaveCode,
    Leave_name: leaveName,
    Fin_year: yearId ? String(yearId) : "",
    Year_Id: yearId,
    Financial_year: yearName,
    Opening_balance: opening,
    Allocated_days: allocated,
    Allocation: allocated,
    Earned_days: earned,
    Carry_forward_days: carry,
    Used_days: used,
    Balance_days: Math.max(opening + allocated + earned + carry - used, 0),
    Status: toOrganizationStatusLabel(statusRaw),
    Status_code:
      statusRaw === 0 || statusRaw === "0" || String(statusRaw).toLowerCase() === "inactive"
        ? 0
        : 1,
  };
}

function decimalOrZero(value: unknown): number {
  const num = optionalNumber(value);
  return num == null || num < 0 ? 0 : num;
}

function parseLeavesFromRow(row: HrmsRow): LeaveAllocationLeavePayload[] {
  const leavesRaw =
    typeof row.Leaves === "string"
      ? (() => {
          try {
            return JSON.parse(row.Leaves) as unknown[];
          } catch {
            return [];
          }
        })()
      : row.Leaves;

  if (!Array.isArray(leavesRaw) || leavesRaw.length === 0) {
    const leaveId = optionalNumber(row.Leave_id ?? row.Leave_Id);
    if (!leaveId || leaveId <= 0) throw new Error("Leave type is required.");
    return [
      {
        leave_id: leaveId,
        allocated_days: decimalOrZero(row.Allocated_days ?? row.Allocation),
      },
    ];
  }

  return leavesRaw.map((item) => {
    const leave = (item ?? {}) as Record<string, unknown>;
    const leaveId = optionalNumber(leave.leave_id ?? leave.Leave_id ?? leave.Leave_Id);
    if (!leaveId || leaveId <= 0) throw new Error("Leave type is required.");
    return {
      leave_id: leaveId,
      allocated_days: decimalOrZero(
        leave.allocated_days ?? leave.Allocated_days ?? leave.Allocation,
      ),
    };
  });
}

export function rowToLeaveAllocationCreatePayload(row: HrmsRow): LeaveAllocationCreatePayload {
  const finYear = optionalNumber(row.Fin_year ?? row.Year_Id ?? row.Financial_year_id);
  if (!finYear || finYear <= 0) throw new Error("Financial year is required.");

  const employeeId = optionalNumber(row.Employee_id ?? row.Employee_Id);
  const leaves = parseLeavesFromRow(row);

  if (employeeId && employeeId > 0) {
    return {
      employee_id: employeeId,
      fin_year: finYear,
      leaves,
    };
  }

  return {
    fin_year: finYear,
    leaves,
  } as LeaveAllocationCreatePayload;
}

export function rowToLeaveAllocationUpdatePayload(row: HrmsRow): LeaveAllocationUpdatePayload {
  const leaveId = optionalNumber(row.Leave_id ?? row.Leave_Id);
  const status =
    row.Status === "Inactive" || row.Status === 0 || row.Status === "0" ? 0 : 1;

  return {
    ...(leaveId ? { leave_id: leaveId } : {}),
    allocated_days: decimalOrZero(row.Allocated_days ?? row.Allocation),
    status,
  };
}

function enrichAllocationRow(
  row: HrmsRow,
  employeeById: Map<string, HrmsRow>,
  leaveById: Map<string, HrmsRow>,
  yearById: Map<string, string>,
  branchById: Map<string, string>,
): HrmsRow {
  const employeeId = String(row.Employee_id ?? "").trim();
  const employee = employeeId ? employeeById.get(employeeId) : undefined;
  const leaveId = String(row.Leave_id ?? "").trim();
  const leave = leaveId ? leaveById.get(leaveId) : undefined;
  const yearId = String(row.Fin_year ?? row.Year_Id ?? "").trim();
  const branchId = String(row.Branch_Id || employee?.Branch_Id || "").trim();

  const leaveCode = String(row.Leave_code || leave?.Leave_code || leave?.Short_name || "").trim();
  const leaveName = String(row.Leave_type || row.Leave_name || leave?.Leave_name || "").trim();
  const allocated = toDays(row.Allocated_days ?? row.Allocation);
  const opening = toDays(row.Opening_balance);
  const earned = toDays(row.Earned_days);
  const carry = toDays(row.Carry_forward_days);
  const used = toDays(row.Used_days);
  const yearName = String(row.Financial_year || yearById.get(yearId) || "").trim();
  const branchName = String(
    row.Branch_Name || branchById.get(branchId) || employee?.Branch_Name || "",
  ).trim();

  return {
    ...row,
    Employee_code: String(row.Employee_code || employee?.Employee_code || "").trim(),
    Employee_name: String(
      row.Employee_name || employee?.Display_name || employee?.Employee_name || "",
    ).trim(),
    Photo_path: String(row.Photo_path || employee?.Photo_path || "").trim(),
    Branch_Id: branchId,
    Branch_Name: branchName,
    Leave_code: leaveCode,
    Leave_type: leaveName || leaveCode,
    Leave_name: leaveName,
    Financial_year: yearName,
    Fin_year: yearId || String(row.Fin_year ?? ""),
    Allocation: allocated,
    Allocated_days: allocated,
    Balance_days: Math.max(opening + allocated + earned + carry - used, 0),
  };
}

function sortAllocationRows(rows: HrmsRow[]): HrmsRow[] {
  return [...rows].sort((left, right) => {
    const yearCmp = String(right.Financial_year ?? "").localeCompare(
      String(left.Financial_year ?? ""),
      undefined,
      { numeric: true },
    );
    if (yearCmp !== 0) return yearCmp;

    const nameCmp = String(left.Employee_name ?? "").localeCompare(
      String(right.Employee_name ?? ""),
      undefined,
      { sensitivity: "base" },
    );
    if (nameCmp !== 0) return nameCmp;

    return String(left.Leave_code ?? left.Leave_type ?? "").localeCompare(
      String(right.Leave_code ?? right.Leave_type ?? ""),
      undefined,
      { sensitivity: "base" },
    );
  });
}

export const leaveAllocationService = {
  list: async (query?: LeaveAllocationListQuery) => {
    const [payload, employees, leaveTypes, years, branches] = await Promise.all([
      apiClient.get<unknown>(withListQuery(API_ENDPOINTS.leaveAllocation.list, query)),
      employeeService.list({ status: 1 }).catch(() => [] as HrmsRow[]),
      leaveMasterService.list({ status: 1 }).catch(() => [] as HrmsRow[]),
      finYearService.list({ status: 1 }).catch(() => [] as HrmsRow[]),
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

    const leaveById = new Map(
      leaveTypes
        .map((leave) => {
          const id = String(leave.Leave_Id ?? leave.id ?? "").trim();
          return id ? ([id, leave] as const) : null;
        })
        .filter((entry): entry is readonly [string, HrmsRow] => entry !== null),
    );

    const yearById = new Map(
      years
        .map((year) => {
          const id = String(year.Year_Id ?? year.id ?? "").trim();
          const name = String(year.Year_Name ?? year.Financial_year ?? "").trim();
          return id && name ? ([id, name] as const) : null;
        })
        .filter((entry): entry is readonly [string, string] => entry !== null),
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

    return sortAllocationRows(
      asList(payload).map((record) =>
        enrichAllocationRow(
          leaveAllocationToRow(record),
          employeeById,
          leaveById,
          yearById,
          branchById,
        ),
      ),
    );
  },

  create: async (row: HrmsRow) => {
    const body = rowToLeaveAllocationCreatePayload(row);
    const payload = await apiClient.post<unknown>(API_ENDPOINTS.leaveAllocation.create, body);
    const rows = asList(payload).map(leaveAllocationToRow);
    return rows[0] ?? leaveAllocationToRow(asSingle(payload));
  },

  update: async (id: string | number, row: HrmsRow) => {
    const body = rowToLeaveAllocationUpdatePayload(row);
    const payload = await apiClient.put<unknown>(API_ENDPOINTS.leaveAllocation.update(id), body);
    return leaveAllocationToRow(asSingle(payload));
  },

  remove: async (id: string | number) => {
    await apiClient.delete(API_ENDPOINTS.leaveAllocation.delete(id));
  },
};
