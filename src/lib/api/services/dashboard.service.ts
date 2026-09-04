import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  DashboardAttendanceTrend,
  DashboardDepartmentDistribution,
  DashboardOverview,
  DashboardOverviewQuery,
  DashboardSummary,
  DashboardSummaryMetric,
  DashboardTodayAttendance,
  DashboardTrend,
} from "@/lib/api/types";

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

function toTrend(value: unknown, changePercent: number): DashboardTrend {
  const text = optionalText(value)?.toLowerCase();
  if (text === "up" || text === "down" || text === "flat") return text;
  if (changePercent > 0) return "up";
  if (changePercent < 0) return "down";
  return "flat";
}

function toMetric(value: unknown): DashboardSummaryMetric {
  const record = asRecord(value) ?? {};
  const changePercent = optionalNumber(readValue(record, ["change_percent", "changePercent"])) ?? 0;
  const active = optionalNumber(readValue(record, ["active", "Active"]));
  const newlyJoined = optionalNumber(readValue(record, ["new", "New"]));

  return {
    value: optionalNumber(readValue(record, ["value", "Value"])) ?? 0,
    change_percent: changePercent,
    trend: toTrend(readValue(record, ["trend", "Trend"]), changePercent),
    compare_label: optionalText(readValue(record, ["compare_label", "compareLabel"])) ?? "",
    ...(active !== null ? { active } : {}),
    ...(newlyJoined !== null ? { new: newlyJoined } : {}),
  };
}

function toSummary(value: unknown): DashboardSummary {
  const record = asRecord(value) ?? {};
  return {
    total_employees: toMetric(readValue(record, ["total_employees", "totalEmployees"])),
    on_leave: toMetric(readValue(record, ["on_leave", "onLeave"])),
    absent_today: toMetric(readValue(record, ["absent_today", "absentToday"])),
    present_today: toMetric(readValue(record, ["present_today", "presentToday"])),
    late_today: toMetric(readValue(record, ["late_today", "lateToday"])),
    on_probation: toMetric(readValue(record, ["on_probation", "onProbation"])),
  };
}

function toTodayAttendance(value: unknown): DashboardTodayAttendance[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item) ?? {};
    return {
      Employee_id: optionalNumber(readValue(record, ["Employee_id", "employee_id", "id"])) ?? 0,
      Employee_code: optionalText(readValue(record, ["Employee_code", "employee_code"])) ?? "",
      Employee_name: optionalText(readValue(record, ["Employee_name", "employee_name"])) ?? "",
      In_time: optionalText(readValue(record, ["In_time", "in_time"])),
      Out_time: optionalText(readValue(record, ["Out_time", "out_time"])),
      Attendance_status:
        optionalNumber(readValue(record, ["Attendance_status", "attendance_status"])) ?? 0,
      Attendance_status_name:
        optionalText(readValue(record, ["Attendance_status_name", "attendance_status_name"])) ??
        "",
    };
  });
}

function toAttendanceTrend(value: unknown): DashboardAttendanceTrend[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item) ?? {};
    return {
      Attendance_date: optionalText(readValue(record, ["Attendance_date", "attendance_date"])) ?? "",
      Day_label: optionalText(readValue(record, ["Day_label", "day_label"])) ?? "",
      Present_count: optionalNumber(readValue(record, ["Present_count", "present_count"])) ?? 0,
      Absent_count: optionalNumber(readValue(record, ["Absent_count", "absent_count"])) ?? 0,
      Late_count: optionalNumber(readValue(record, ["Late_count", "late_count"])) ?? 0,
    };
  });
}

function toDepartmentDistribution(value: unknown): DashboardDepartmentDistribution[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item) ?? {};
    return {
      Dept_Id: optionalNumber(readValue(record, ["Dept_Id", "dept_id", "id"])) ?? 0,
      Dept_Name: optionalText(readValue(record, ["Dept_Name", "dept_name"])) ?? "",
      Employee_count:
        optionalNumber(readValue(record, ["Employee_count", "employee_count", "count"])) ?? 0,
    };
  });
}

function asOverview(payload: unknown): DashboardOverview {
  const record = asRecord(payload) ?? {};
  const nested = asRecord(readValue(record, ["data"])) ?? record;

  return {
    as_of_date: optionalText(readValue(nested, ["as_of_date", "asOfDate"])) ?? "",
    summary: toSummary(readValue(nested, ["summary"])),
    today_attendance: toTodayAttendance(readValue(nested, ["today_attendance", "todayAttendance"])),
    attendance_trend: toAttendanceTrend(readValue(nested, ["attendance_trend", "attendanceTrend"])),
    department_distribution: toDepartmentDistribution(
      readValue(nested, ["department_distribution", "departmentDistribution"]),
    ),
  };
}

function withOverviewQuery(basePath: string, query?: DashboardOverviewQuery): string {
  const params = new URLSearchParams();
  if (query?.as_of_date) params.set("as_of_date", query.as_of_date);
  if (query?.branch_id !== undefined) params.set("branch_id", String(query.branch_id));
  if (query?.dept_id !== undefined) params.set("dept_id", String(query.dept_id));
  if (query?.limit !== undefined) params.set("limit", String(query.limit));
  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function attendanceTrendToPercentages(rows: DashboardAttendanceTrend[]): {
  categories: string[];
  data: number[];
} {
  const categories = rows.map((row) => row.Day_label || row.Attendance_date);
  const data = rows.map((row) => {
    const total = row.Present_count + row.Absent_count + row.Late_count;
    if (total <= 0) return 0;
    return Math.round((row.Present_count / total) * 1000) / 10;
  });
  return { categories, data };
}

export const dashboardService = {
  overview: async (query?: DashboardOverviewQuery): Promise<DashboardOverview> => {
    const payload = await apiClient.get<unknown>(
      withOverviewQuery(API_ENDPOINTS.dashboard.overview, query),
    );
    return asOverview(payload);
  },
  analytics: () => apiClient.get<Record<string, unknown>>(API_ENDPOINTS.dashboard.analytics),
  sales: () => apiClient.get<Record<string, unknown>>(API_ENDPOINTS.dashboard.sales),
  attendance: () => apiClient.get<Record<string, unknown>>(API_ENDPOINTS.dashboard.attendance),
  performance: () => apiClient.get<Record<string, unknown>>(API_ENDPOINTS.dashboard.performance),
};
