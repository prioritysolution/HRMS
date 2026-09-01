import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ApplOptionRecord,
  AttendanceListQuery,
  AttendancePunchListQuery,
  AttendancePunchRecord,
  AttendancePunchWritePayload,
  AttendanceRecord,
  AttendanceWritePayload,
} from "@/lib/api/types";
import { formatDateDisplay, parseDateToIso } from "@/lib/date-utils";
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
  return text || null;
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function asAttendanceList(payload: unknown): AttendanceRecord[] {
  if (Array.isArray(payload)) return payload as AttendanceRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as AttendanceRecord[];
  return [];
}

function asAttendance(payload: unknown): AttendanceRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as AttendanceRecord;
}

function asPunchList(payload: unknown): AttendancePunchRecord[] {
  if (Array.isArray(payload)) return payload as AttendancePunchRecord[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as AttendancePunchRecord[];
  return [];
}

function asPunch(payload: unknown): AttendancePunchRecord {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  const punchRecord = nested ? readValue(nested, ["punch"]) : undefined;
  if (punchRecord && typeof punchRecord === "object") {
    return punchRecord as AttendancePunchRecord;
  }
  return (nested ?? record ?? payload) as AttendancePunchRecord;
}

function extractTime(value: unknown): string {
  const text = optionalText(value);
  if (!text) return "";
  const match = text.match(/(\d{1,2}:\d{2})(?::\d{2})?/);
  if (!match) return text;
  const [hours, minutes] = match[1].split(":");
  return `${hours.padStart(2, "0")}:${minutes}`;
}

function formatTimeForApi(value: unknown): string {
  const text = optionalText(value);
  if (!text) return "";
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(text)) return text;
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [hours, minutes] = text.split(":");
    return `${hours.padStart(2, "0")}:${minutes}:00`;
  }
  return text;
}

function combineDateTime(dateValue: unknown, timeValue: unknown): string | null {
  const dateRaw = optionalText(dateValue);
  if (!dateRaw) return null;
  const dateIso = parseDateToIso(dateRaw) || dateRaw;
  const time = formatTimeForApi(timeValue);
  if (!time) return null;
  return `${dateIso} ${time}`;
}

function withListQuery(basePath: string, query?: AttendanceListQuery): string {
  const params = new URLSearchParams();

  if (query?.attendance_id !== undefined) {
    params.set("attendance_id", String(query.attendance_id));
  }
  if (query?.employee_id !== undefined) {
    params.set("employee_id", String(query.employee_id));
  }
  if (query?.attendance_date) {
    params.set("attendance_date", query.attendance_date);
  }
  if (query?.from_date) {
    params.set("from_date", query.from_date);
  }
  if (query?.to_date) {
    params.set("to_date", query.to_date);
  }
  if (query?.branch_id !== undefined) {
    params.set("branch_id", String(query.branch_id));
  }
  if (query?.dept_id !== undefined) {
    params.set("dept_id", String(query.dept_id));
  }
  if (query?.shift_id !== undefined) {
    params.set("shift_id", String(query.shift_id));
  }
  if (query?.attendance_status !== undefined) {
    params.set("attendance_status", String(query.attendance_status));
  }
  if (query?.source !== undefined) {
    params.set("source", String(query.source));
  }

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

function withPunchListQuery(basePath: string, query?: AttendancePunchListQuery): string {
  const params = new URLSearchParams();

  if (query?.punch_id !== undefined) {
    params.set("punch_id", String(query.punch_id));
  }
  if (query?.employee_id !== undefined) {
    params.set("employee_id", String(query.employee_id));
  }
  if (query?.device_id !== undefined) {
    params.set("device_id", String(query.device_id));
  }
  if (query?.punch_date) {
    params.set("punch_date", query.punch_date);
  }
  if (query?.from_date) {
    params.set("from_date", query.from_date);
  }
  if (query?.to_date) {
    params.set("to_date", query.to_date);
  }
  if (query?.punch_type !== undefined) {
    params.set("punch_type", String(query.punch_type));
  }
  if (query?.source !== undefined) {
    params.set("source", String(query.source));
  }

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function attendanceToRow(record: AttendanceRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const attendanceId = readValue(source, ["Attendance_id", "attendance_id", "id"]);
  const statusName =
    optionalText(readValue(source, ["Attendance_status_name", "attendance_status_name"])) ?? "";
  const sourceName = optionalText(readValue(source, ["Source_name", "source_name"])) ?? "";
  const attendanceDate = optionalText(readValue(source, ["Attendance_date", "attendance_date"]));
  const earlyLeave = optionalNumber(
    readValue(source, ["Early_leave_minutes", "early_leave_minutes"]),
  );

  return {
    id: String(attendanceId ?? ""),
    Attendance_id: Number(attendanceId ?? 0),
    Employee_id: Number(readValue(source, ["Employee_id", "employee_id"]) ?? 0),
    Employee_code:
      optionalText(readValue(source, ["Employee_code", "employee_code"])) ?? "",
    Employee_name:
      optionalText(readValue(source, ["Employee_name", "employee_name"])) ?? "",
    Branch_Id: optionalNumber(readValue(source, ["Branch_Id", "branch_id"])),
    Dept_Id: optionalNumber(readValue(source, ["Dept_Id", "dept_id"])),
    Dept_Name: optionalText(readValue(source, ["Dept_Name", "dept_name"])) ?? "",
    Attendance_date: attendanceDate ? formatDateDisplay(attendanceDate) : "",
    Shift_id: optionalNumber(readValue(source, ["Shift_id", "shift_id"])),
    Shift_code: optionalText(readValue(source, ["Shift_code", "shift_code"])) ?? "",
    Shift_name: optionalText(readValue(source, ["Shift_name", "shift_name"])) ?? "",
    Check_in: extractTime(readValue(source, ["Check_in", "check_in"])),
    Check_out: extractTime(readValue(source, ["Check_out", "check_out"])),
    Working_minutes: optionalNumber(readValue(source, ["Working_minutes", "working_minutes"])) ?? "",
    Overtime_minutes: optionalNumber(readValue(source, ["Overtime_minutes", "overtime_minutes"])) ?? "",
    Late_minutes: optionalNumber(readValue(source, ["Late_minutes", "late_minutes"])) ?? "",
    Early_departure_minutes: earlyLeave ?? "",
    Attendance_status: statusName,
    Attendance_status_code: optionalNumber(
      readValue(source, ["Attendance_status_code", "Attendance_status", "attendance_status"]),
    ),
    Source: sourceName,
    Source_code: optionalNumber(readValue(source, ["Source_code", "Source", "source"])),
    Remarks: optionalText(readValue(source, ["Remarks", "remarks"])) ?? "",
    Created_by: optionalNumber(readValue(source, ["Created_by", "created_by"])),
    Created_at: optionalText(readValue(source, ["Created_at", "created_at"])) ?? "",
    Updated_at: optionalText(readValue(source, ["Updated_at", "updated_at"])) ?? "",
  };
}

export function punchToRow(record: AttendancePunchRecord): HrmsRow {
  const source = record as unknown as Record<string, unknown>;
  const punchId = readValue(source, ["Punch_id", "punch_id", "id"]);

  return {
    id: String(punchId ?? ""),
    Punch_id: Number(punchId ?? 0),
    Employee_id: Number(readValue(source, ["Employee_id", "employee_id"]) ?? 0),
    Employee_code:
      optionalText(readValue(source, ["Employee_code", "employee_code"])) ?? "",
    Employee_name:
      optionalText(readValue(source, ["Employee_name", "employee_name"])) ?? "",
    Device_id: optionalNumber(readValue(source, ["Device_id", "device_id"])),
    Device_name: optionalText(readValue(source, ["Device_name", "device_name"])) ?? "",
    Punch_time: optionalText(readValue(source, ["Punch_time", "punch_time"])) ?? "",
    Punch_type:
      optionalText(readValue(source, ["Punch_type_name", "punch_type_name"])) ??
      String(readValue(source, ["Punch_type", "punch_type"]) ?? ""),
    Punch_type_code: optionalNumber(readValue(source, ["Punch_type_code", "Punch_type", "punch_type"])),
    Source:
      optionalText(readValue(source, ["Source_name", "source_name"])) ??
      String(readValue(source, ["Source", "source"]) ?? ""),
    Source_code: optionalNumber(readValue(source, ["Source_code", "Source", "source"])),
  };
}

function resolveEmployeeId(row: HrmsRow, employees: HrmsRow[]): number {
  const directId = Number(row.Employee_id);
  if (Number.isFinite(directId) && directId > 0) return directId;

  const code = String(row.Employee_code ?? "").trim();
  const employee = employees.find(
    (item) => String(item.Employee_code ?? "").trim() === code,
  );
  return Number(employee?.Employee_id ?? 0);
}

function resolveShiftId(row: HrmsRow, shifts: HrmsRow[]): number {
  const directId = Number(row.Shift_id);
  if (Number.isFinite(directId) && directId > 0) return directId;

  const shiftName = String(row.Shift_name ?? "").trim();
  const shift = shifts.find(
    (item) => String(item.Shift_name ?? "").trim() === shiftName,
  );
  return Number(shift?.Shift_id ?? 0);
}

function resolveOptionCode(
  value: unknown,
  codeValue: unknown,
  options: ApplOptionRecord[],
): number {
  const directCode = Number(codeValue);
  if (Number.isFinite(directCode) && directCode > 0) return directCode;

  const label = String(value ?? "").trim();
  if (!label) return 0;

  const byLabel = options.find(
    (option) =>
      String(option.Opt_Description).toLowerCase() === label.toLowerCase(),
  );
  if (byLabel) return Number(byLabel.Opt_Code);

  const byCode = options.find((option) => String(option.Opt_Code) === label);
  return byCode ? Number(byCode.Opt_Code) : 0;
}

export function rowToAttendancePayload(
  row: HrmsRow,
  context: {
    employees: HrmsRow[];
    shifts: HrmsRow[];
    statusOptions: ApplOptionRecord[];
    sourceOptions: ApplOptionRecord[];
  },
): AttendanceWritePayload {
  const employeeId = resolveEmployeeId(row, context.employees);
  if (!Number.isFinite(employeeId) || employeeId <= 0) {
    throw new Error("Employee is required.");
  }

  const attendanceDateRaw = String(row.Attendance_date ?? "").trim();
  const attendanceDate = parseDateToIso(attendanceDateRaw) || attendanceDateRaw;
  if (!attendanceDate) {
    throw new Error("Attendance date is required.");
  }

  const shiftId = resolveShiftId(row, context.shifts);
  const attendanceStatus = resolveOptionCode(
    row.Attendance_status,
    row.Attendance_status_code,
    context.statusOptions,
  );
  const source = resolveOptionCode(row.Source, row.Source_code, context.sourceOptions) || 4;

  const checkIn = combineDateTime(attendanceDate, row.Check_in);
  const checkOut = combineDateTime(attendanceDate, row.Check_out);

  return {
    employee_id: employeeId,
    attendance_date: attendanceDate,
    ...(shiftId > 0 ? { shift_id: shiftId } : {}),
    ...(checkIn ? { check_in: checkIn } : { check_in: null }),
    ...(checkOut ? { check_out: checkOut } : { check_out: null }),
    ...(attendanceStatus > 0 ? { attendance_status: attendanceStatus } : {}),
    source,
    remarks: optionalText(row.Remarks),
  };
}

export function rowToPunchPayload(row: HrmsRow): AttendancePunchWritePayload {
  const employeeId = Number(row.Employee_id ?? 0);
  if (!Number.isFinite(employeeId) || employeeId <= 0) {
    throw new Error("Employee is required.");
  }

  const payload: AttendancePunchWritePayload = {
    employee_id: employeeId,
  };

  const punchTime = optionalText(row.Punch_time);
  if (punchTime) payload.punch_time = punchTime;

  const punchType = optionalNumber(row.Punch_type_code ?? row.Punch_type);
  if (punchType !== null) payload.punch_type = punchType;

  const source = optionalNumber(row.Source_code ?? row.Source);
  if (source !== null) payload.source = source;

  const deviceId = optionalNumber(row.Device_id);
  if (deviceId !== null) payload.device_id = deviceId;

  return payload;
}

export function toFormRow(row: HrmsRow): HrmsRow {
  return {
    ...row,
    Employee_code: String(row.Employee_code ?? ""),
    Attendance_date: String(row.Attendance_date ?? ""),
    Shift_name: String(row.Shift_name ?? ""),
    Check_in: String(row.Check_in ?? ""),
    Check_out: String(row.Check_out ?? ""),
    Attendance_status: String(row.Attendance_status ?? ""),
    Source: String(row.Source ?? "Manual attendance"),
    Remarks: String(row.Remarks ?? ""),
  };
}

export const attendanceService = {
  list: async (query?: AttendanceListQuery): Promise<HrmsRow[]> => {
    const payload = await apiClient.get<unknown>(
      withListQuery(API_ENDPOINTS.attendance.list, query),
    );
    return asAttendanceList(payload).map(attendanceToRow);
  },

  create: async (
    row: HrmsRow,
    context: {
      employees: HrmsRow[];
      shifts: HrmsRow[];
      statusOptions: ApplOptionRecord[];
      sourceOptions: ApplOptionRecord[];
    },
  ): Promise<HrmsRow> => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.attendance.create,
      rowToAttendancePayload(row, context),
    );
    return attendanceToRow(asAttendance(payload));
  },

  update: async (
    id: string | number,
    row: HrmsRow,
    context: {
      employees: HrmsRow[];
      shifts: HrmsRow[];
      statusOptions: ApplOptionRecord[];
      sourceOptions: ApplOptionRecord[];
    },
  ): Promise<HrmsRow> => {
    const payload = await apiClient.put<unknown>(
      API_ENDPOINTS.attendance.update(id),
      rowToAttendancePayload(row, context),
    );
    return attendanceToRow(asAttendance(payload));
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.attendance.delete(id),
      { unwrap: false },
    ),

  punchList: async (query?: AttendancePunchListQuery): Promise<HrmsRow[]> => {
    const payload = await apiClient.get<unknown>(
      withPunchListQuery(API_ENDPOINTS.attendance.punchList, query),
    );
    return asPunchList(payload).map(punchToRow);
  },

  punchCreate: async (row: HrmsRow): Promise<HrmsRow> => {
    const payload = await apiClient.post<unknown>(
      API_ENDPOINTS.attendance.punchCreate,
      rowToPunchPayload(row),
    );
    return punchToRow(asPunch(payload));
  },
};
