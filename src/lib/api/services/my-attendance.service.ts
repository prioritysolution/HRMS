import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  MyAttendanceCalendar,
  MyAttendanceCalendarDay,
  MyAttendanceCalendarQuery,
  MyAttendanceCalendarSummary,
} from "@/lib/api/types";

export type AttendanceDayTone =
  | "default"
  | "present"
  | "absent"
  | "leave"
  | "holiday"
  | "late"
  | "half-day"
  | "weekly-off";

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

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === false) return null;
  const text = String(value).trim();
  return text || null;
}

function toFlag(value: unknown): number {
  if (value === true || value === 1 || value === "1" || value === "Yes") return 1;
  return 0;
}

function toSummary(value: unknown): MyAttendanceCalendarSummary {
  const record = asRecord(value) ?? {};
  return {
    Present_count: optionalNumber(readValue(record, ["Present_count", "present_count"])) ?? 0,
    Absent_count: optionalNumber(readValue(record, ["Absent_count", "absent_count"])) ?? 0,
    Leave_count: optionalNumber(readValue(record, ["Leave_count", "leave_count"])) ?? 0,
    Holiday_count: optionalNumber(readValue(record, ["Holiday_count", "holiday_count"])) ?? 0,
    Late_count: optionalNumber(readValue(record, ["Late_count", "late_count"])) ?? 0,
    Half_day_count: optionalNumber(readValue(record, ["Half_day_count", "half_day_count"])) ?? 0,
    Weekly_off_count:
      optionalNumber(readValue(record, ["Weekly_off_count", "weekly_off_count"])) ?? 0,
  };
}

function toDay(value: unknown): MyAttendanceCalendarDay {
  const record = asRecord(value) ?? {};
  return {
    Day_no: optionalNumber(readValue(record, ["Day_no", "day_no"])) ?? 0,
    Attendance_date:
      optionalText(readValue(record, ["Attendance_date", "attendance_date"])) ?? "",
    Weekday: optionalNumber(readValue(record, ["Weekday", "weekday"])) ?? 0,
    Day_name: optionalText(readValue(record, ["Day_name", "day_name"])) ?? "",
    Is_weekend: toFlag(readValue(record, ["Is_weekend", "is_weekend"])),
    Is_holiday: toFlag(readValue(record, ["Is_holiday", "is_holiday"])),
    Holiday_id: optionalNumber(readValue(record, ["Holiday_id", "holiday_id"])),
    Holiday_name: optionalText(readValue(record, ["Holiday_name", "holiday_name"])),
    Holiday_type: optionalNumber(readValue(record, ["Holiday_type", "holiday_type"])),
    Holiday_type_name: optionalText(
      readValue(record, ["Holiday_type_name", "holiday_type_name"]),
    ),
    Is_leave: toFlag(readValue(record, ["Is_leave", "is_leave"])),
    Leave_Application_Id: optionalNumber(
      readValue(record, ["Leave_Application_Id", "leave_application_id"]),
    ),
    Leave_Id: optionalNumber(readValue(record, ["Leave_Id", "leave_id"])),
    Leave_Name: optionalText(readValue(record, ["Leave_Name", "leave_name"])),
    Half_Day: optionalNumber(readValue(record, ["Half_Day", "half_day"])),
    Attendance_id: optionalNumber(readValue(record, ["Attendance_id", "attendance_id"])),
    Shift_id: optionalNumber(readValue(record, ["Shift_id", "shift_id"])),
    Check_in: optionalText(readValue(record, ["Check_in", "check_in"])),
    Check_out: optionalText(readValue(record, ["Check_out", "check_out"])),
    Working_minutes: optionalNumber(readValue(record, ["Working_minutes", "working_minutes"])),
    Overtime_minutes: optionalNumber(readValue(record, ["Overtime_minutes", "overtime_minutes"])),
    Late_minutes: optionalNumber(readValue(record, ["Late_minutes", "late_minutes"])),
    Early_leave_minutes: optionalNumber(
      readValue(record, ["Early_leave_minutes", "early_leave_minutes"]),
    ),
    Attendance_status: optionalNumber(
      readValue(record, ["Attendance_status", "attendance_status"]),
    ),
    Attendance_status_name: optionalText(
      readValue(record, ["Attendance_status_name", "attendance_status_name"]),
    ),
    Source: optionalText(readValue(record, ["Source", "source"])),
    Remarks: optionalText(readValue(record, ["Remarks", "remarks"])),
    Day_status: optionalNumber(readValue(record, ["Day_status", "day_status"])),
    Day_status_name: optionalText(readValue(record, ["Day_status_name", "day_status_name"])),
    Day_label: optionalText(readValue(record, ["Day_label", "day_label"])),
  };
}

function asCalendar(payload: unknown): MyAttendanceCalendar {
  const record = asRecord(payload) ?? {};
  const nested = asRecord(readValue(record, ["data"])) ?? record;
  const daysRaw = readValue(nested, ["days"]);

  return {
    employee_id: optionalNumber(readValue(nested, ["employee_id", "Employee_id"])) ?? 0,
    employee_code: optionalText(readValue(nested, ["employee_code", "Employee_code"])) ?? "",
    employee_name: optionalText(readValue(nested, ["employee_name", "Employee_name"])) ?? "",
    display_name: optionalText(readValue(nested, ["display_name", "Display_name"])) ?? "",
    year: optionalNumber(readValue(nested, ["year", "Year"])) ?? 0,
    month: optionalNumber(readValue(nested, ["month", "Month"])) ?? 0,
    month_name: optionalText(readValue(nested, ["month_name", "Month_name"])) ?? "",
    month_start: optionalText(readValue(nested, ["month_start", "Month_start"])) ?? "",
    month_end: optionalText(readValue(nested, ["month_end", "Month_end"])) ?? "",
    summary: toSummary(readValue(nested, ["summary"])),
    days: Array.isArray(daysRaw) ? daysRaw.map(toDay) : [],
  };
}

function withCalendarQuery(basePath: string, query: MyAttendanceCalendarQuery): string {
  const params = new URLSearchParams();
  params.set("year", String(query.year));
  params.set("month", String(query.month));
  if (query.employee_id !== undefined) {
    params.set("employee_id", String(query.employee_id));
  }
  return `${basePath}?${params.toString()}`;
}

export function myAttendanceDayTone(day: MyAttendanceCalendarDay): AttendanceDayTone {
  const status = `${day.Day_status_name ?? ""} ${day.Attendance_status_name ?? ""}`.toLowerCase();

  if (day.Is_holiday === 1 || status.includes("holiday")) return "holiday";
  if (day.Is_leave === 1 || status.includes("leave")) return "leave";
  if (day.Half_Day != null || status.includes("half")) return "half-day";
  if (day.Is_weekend === 1 || status.includes("weekly") || status.includes("week off")) {
    return "weekly-off";
  }
  if (status.includes("absent")) return "absent";
  if (status.includes("late")) return "late";
  if (status.includes("present")) return "present";
  return "default";
}

export function myAttendanceDayLabel(day: MyAttendanceCalendarDay): string {
  return (
    day.Day_label ||
    day.Holiday_name ||
    day.Leave_Name ||
    day.Day_status_name ||
    day.Attendance_status_name ||
    ""
  );
}

export const myAttendanceService = {
  calendar: async (query: MyAttendanceCalendarQuery): Promise<MyAttendanceCalendar> => {
    const payload = await apiClient.get<unknown>(
      withCalendarQuery(API_ENDPOINTS.myAttendance.calendar, query),
    );
    return asCalendar(payload);
  },
};
