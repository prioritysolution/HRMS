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
  EmpDashboard,
  EmpDashboardHeader,
  EmpDashboardLastPayslip,
  EmpDashboardLeaveBalance,
  EmpDashboardMonthlyAttendance,
  EmpDashboardQuery,
  EmpDashboardSalaryHistoryItem,
  EmpDashboardSummary,
  EmpDashboardTimelineItem,
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

function withEmpDashboardQuery(basePath: string, query: EmpDashboardQuery): string {
  const params = new URLSearchParams();
  params.set("employee_id", String(query.employee_id));
  if (query.as_of_date) params.set("as_of_date", query.as_of_date);
  return `${basePath}?${params.toString()}`;
}

function toEmpHeader(value: unknown): EmpDashboardHeader {
  const record = asRecord(value) ?? {};
  return {
    greeting: optionalText(readValue(record, ["greeting", "Greeting"])) ?? "Hello",
    employee_id: optionalNumber(readValue(record, ["employee_id", "Employee_id"])) ?? 0,
    employee_code: optionalText(readValue(record, ["employee_code", "Employee_code"])) ?? "",
    employee_name: optionalText(readValue(record, ["employee_name", "Employee_name"])) ?? "",
    display_name: optionalText(readValue(record, ["display_name", "Display_name"])) ?? "",
    as_of_date: optionalText(readValue(record, ["as_of_date", "As_of_date"])) ?? "",
    display_date: optionalText(readValue(record, ["display_date", "Display_date"])) ?? "",
    subtitle:
      optionalText(readValue(record, ["subtitle", "Subtitle"])) ??
      "Your attendance, leave, and payslip snapshot for today.",
  };
}

function toEmpSummary(value: unknown): EmpDashboardSummary {
  const record = asRecord(value) ?? {};
  const workingHours =
    optionalText(readValue(record, ["working_hours", "Working_hours"])) ?? "00:00";
  const leavesLeft =
    optionalNumber(readValue(record, ["total_leaves_left", "Total_leaves_left"])) ?? 0;

  return {
    attendance_status:
      optionalNumber(readValue(record, ["attendance_status", "Attendance_status"])) ?? 0,
    attendance_status_name:
      optionalText(readValue(record, ["attendance_status_name", "Attendance_status_name"])) ?? "",
    attendance_status_label:
      optionalText(readValue(record, ["attendance_status_label", "Attendance_status_label"])) ??
      "—",
    scheduled_check_out:
      optionalText(readValue(record, ["scheduled_check_out", "Scheduled_check_out"])) ?? "—",
    working_minutes:
      optionalNumber(readValue(record, ["working_minutes", "Working_minutes"])) ?? 0,
    working_hours: workingHours,
    working_hours_label:
      optionalText(readValue(record, ["working_hours_label", "Working_hours_label"])) ??
      `${workingHours} Hrs`,
    total_leaves_left: leavesLeft,
    total_leaves_left_label:
      optionalText(readValue(record, ["total_leaves_left_label", "Total_leaves_left_label"])) ??
      `${leavesLeft} Days`,
  };
}

function toEmpTimeline(value: unknown): EmpDashboardTimelineItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = asRecord(item) ?? {};
    return {
      Punch_id: optionalNumber(readValue(record, ["Punch_id", "punch_id", "id"])) ?? index + 1,
      Event_time_display:
        optionalText(readValue(record, ["Event_time_display", "event_time_display", "time"])) ??
        "—",
      Event_label:
        optionalText(readValue(record, ["Event_label", "event_label", "label"])) ?? "Event",
      Punch_type: optionalNumber(readValue(record, ["Punch_type", "punch_type"])) ?? 0,
    };
  });
}

function toEmpLeaveBalances(value: unknown): EmpDashboardLeaveBalance[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = asRecord(item) ?? {};
    return {
      Leave_Id: optionalNumber(readValue(record, ["Leave_Id", "leave_id", "id"])) ?? index + 1,
      Leave_Name: optionalText(readValue(record, ["Leave_Name", "leave_name", "name"])) ?? "Leave",
      Used_Days: optionalNumber(readValue(record, ["Used_Days", "used_days"])) ?? 0,
      Total_Days: optionalNumber(readValue(record, ["Total_Days", "total_days"])) ?? 0,
      Balance_Days: optionalNumber(readValue(record, ["Balance_Days", "balance_days"])) ?? 0,
      Used_Percent: optionalNumber(readValue(record, ["Used_Percent", "used_percent"])) ?? 0,
    };
  });
}

function toEmpLastPayslip(value: unknown): EmpDashboardLastPayslip | null {
  const record = asRecord(value);
  if (!record) return null;

  const period =
    optionalText(
      readValue(record, [
        "period",
        "Period",
        "Payroll_month",
        "payroll_month",
        "Month_year",
        "month_year",
      ]),
    ) ?? "";
  const netSalary =
    optionalNumber(
      readValue(record, ["net_salary", "Net_salary", "Net_pay", "net_pay", "NetPay"]),
    ) ?? 0;
  const paidOn =
    optionalText(
      readValue(record, [
        "paid_on",
        "Paid_on",
        "Payment_date",
        "payment_date",
        "Paid_date",
      ]),
    ) ?? "";
  const status =
    optionalText(
      readValue(record, [
        "status",
        "Status",
        "Bank_transfer_status",
        "bank_transfer_status",
        "Payslip_status",
      ]),
    ) ?? "";

  if (!period && !netSalary && !paidOn) return null;

  return {
    period: period || "—",
    net_salary: netSalary,
    paid_on: paidOn || "—",
    status: status || "—",
  };
}

function toEmpSalaryHistory(value: unknown): EmpDashboardSalaryHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item) ?? {};
      return {
        month:
          optionalText(
            readValue(record, [
              "month",
              "Month",
              "Month_label",
              "month_label",
              "Payroll_month",
              "payroll_month",
            ]),
          ) ?? "",
        net_pay:
          optionalNumber(
            readValue(record, ["net_pay", "Net_pay", "net_salary", "Net_salary", "amount"]),
          ) ?? 0,
      };
    })
    .filter((item) => item.month);
}

function toEmpMonthlyAttendance(value: unknown): EmpDashboardMonthlyAttendance | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    Year_no: optionalNumber(readValue(record, ["Year_no", "year_no", "year"])) ?? 0,
    Month_no: optionalNumber(readValue(record, ["Month_no", "month_no", "month"])) ?? 0,
    Month_name: optionalText(readValue(record, ["Month_name", "month_name"])) ?? "",
    Present_count: optionalNumber(readValue(record, ["Present_count", "present_count"])) ?? 0,
    Absent_count: optionalNumber(readValue(record, ["Absent_count", "absent_count"])) ?? 0,
    Leave_count: optionalNumber(readValue(record, ["Leave_count", "leave_count"])) ?? 0,
    Holiday_count: optionalNumber(readValue(record, ["Holiday_count", "holiday_count"])) ?? 0,
  };
}

function asEmpDashboard(payload: unknown): EmpDashboard {
  const record = asRecord(payload) ?? {};
  const nested = asRecord(readValue(record, ["data"])) ?? record;

  return {
    header: toEmpHeader(readValue(nested, ["header"])),
    summary: toEmpSummary(readValue(nested, ["summary"])),
    timeline: toEmpTimeline(readValue(nested, ["timeline"])),
    leave_balances: toEmpLeaveBalances(readValue(nested, ["leave_balances", "leaveBalances"])),
    last_payslip: toEmpLastPayslip(readValue(nested, ["last_payslip", "lastPayslip"])),
    salary_history: toEmpSalaryHistory(readValue(nested, ["salary_history", "salaryHistory"])),
    monthly_attendance: toEmpMonthlyAttendance(
      readValue(nested, ["monthly_attendance", "monthlyAttendance"]),
    ),
  };
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

const LEAVE_BAR_COLORS = ["#4666e1", "#e17846", "#28adbb", "#e25867", "#55b0db"];

export function empLeaveBalanceColor(index: number): string {
  return LEAVE_BAR_COLORS[index % LEAVE_BAR_COLORS.length];
}

export type EmpTimelineMarkerType = "check-in" | "break" | "break-end" | "check-out";

export function empTimelineMarkerType(item: EmpDashboardTimelineItem): EmpTimelineMarkerType {
  const label = item.Event_label.toLowerCase();
  if (label.includes("break end") || label.includes("break-end")) return "break-end";
  if (label.includes("break")) return "break";
  if (label.includes("check-out") || label.includes("check out") || label.includes("checkout")) {
    return "check-out";
  }
  if (label.includes("check-in") || label.includes("check in") || label.includes("checkin")) {
    return "check-in";
  }
  if (item.Punch_type === 2) return "check-out";
  if (item.Punch_type === 3) return "break";
  return "check-in";
}

export function empMonthlyAttendanceChartItems(
  monthly: EmpDashboardMonthlyAttendance | null,
): Array<{ label: string; value: number; color: string }> {
  if (!monthly) return [];
  return [
    { label: "Present", value: monthly.Present_count, color: "#28adbb" },
    { label: "Absent", value: monthly.Absent_count, color: "#e25867" },
    { label: "Leave", value: monthly.Leave_count, color: "#4666e1" },
    { label: "Holiday", value: monthly.Holiday_count, color: "#e17846" },
  ];
}

export const dashboardService = {
  overview: async (query?: DashboardOverviewQuery): Promise<DashboardOverview> => {
    const payload = await apiClient.get<unknown>(
      withOverviewQuery(API_ENDPOINTS.dashboard.overview, query),
    );
    return asOverview(payload);
  },

  empDashboard: async (query: EmpDashboardQuery): Promise<EmpDashboard> => {
    const payload = await apiClient.get<unknown>(
      withEmpDashboardQuery(API_ENDPOINTS.dashboard.empDashboard, query),
    );
    return asEmpDashboard(payload);
  },

  analytics: () => apiClient.get<Record<string, unknown>>(API_ENDPOINTS.dashboard.analytics),
  sales: () => apiClient.get<Record<string, unknown>>(API_ENDPOINTS.dashboard.sales),
  attendance: () => apiClient.get<Record<string, unknown>>(API_ENDPOINTS.dashboard.attendance),
  performance: () => apiClient.get<Record<string, unknown>>(API_ENDPOINTS.dashboard.performance),
};
