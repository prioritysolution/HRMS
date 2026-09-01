import type { AttendanceStatCard } from "@/components/attendance/AttendanceModulePage";
import { countByStatus, enrichEmployeeAttendanceRow } from "@/lib/attendance-module-utils";
import type { HrmsRow } from "@/types/hrms";

export const DASHBOARD_STATS: AttendanceStatCard[] = [
  {
    title: "Present Today",
    value: (rows) => String(countByStatus(rows, "Present")),
    change: (rows) => `${countByStatus(rows, "Late")} late`,
    hint: "today",
    description: "Employees marked present",
    tone: "success",
    icon: "users",
  },
  {
    title: "Absent",
    value: (rows) => String(countByStatus(rows, "Absent")),
    change: (rows) => `${countByStatus(rows, "Half Day")} half day`,
    hint: "today",
    description: "Absent or partial day",
    tone: "danger",
    icon: "trendingDown",
    positive: false,
  },
  {
    title: "On Leave / Off",
    value: (rows) =>
      String(
        countByStatus(rows, "Leave") +
          countByStatus(rows, "Holiday") +
          countByStatus(rows, "Weekly Off"),
      ),
    change: () => "planned",
    hint: "off",
    description: "Leave, holiday, or weekly off",
    tone: "info",
    icon: "calendar",
  },
];

export const DAILY_STATS: AttendanceStatCard[] = [
  {
    title: "Marked Today",
    value: (rows) => String(rows.length),
    change: (rows) => `${countByStatus(rows, "Present")} present`,
    hint: "records",
    description: "Daily attendance entries",
    tone: "info",
    icon: "clock",
  },
  {
    title: "Late Arrivals",
    value: (rows) => String(countByStatus(rows, "Late")),
    change: (rows) => `${countByStatus(rows, "Early Departure")} early out`,
    hint: "exceptions",
    description: "Late or early departure",
    tone: "warning",
    icon: "trendingDown",
    positive: false,
  },
  {
    title: "Exceptions",
    value: (rows) =>
      String(
        countByStatus(rows, "Absent") +
          countByStatus(rows, "Half Day") +
          countByStatus(rows, "On-Duty"),
      ),
    change: () => "review",
    hint: "needed",
    description: "Absent, half-day, or on-duty",
    tone: "primary",
    icon: "users",
  },
];

export const MONTHLY_STATS: AttendanceStatCard[] = [
  {
    title: "Summaries",
    value: (rows) => String(rows.length),
    change: (rows) =>
      String(rows.filter((r) => String(r.Attendance_status) === "Complete").length),
    hint: "complete",
    description: "Monthly attendance summaries",
    tone: "info",
    icon: "calendar",
  },
  {
    title: "Avg Present",
    value: (rows) => {
      if (rows.length === 0) return "0";
      const total = rows.reduce((sum, row) => sum + Number(row.Present_days ?? 0), 0);
      return String(Math.round(total / rows.length));
    },
    change: () => "days",
    hint: "per emp",
    description: "Average present days",
    tone: "success",
    icon: "users",
  },
  {
    title: "Pending Review",
    value: (rows) =>
      String(rows.filter((r) => String(r.Attendance_status) !== "Complete").length),
    change: () => "awaiting",
    hint: "close",
    description: "Summaries not yet closed",
    tone: "warning",
    icon: "clock",
  },
];

export const PROCESSING_STATS: AttendanceStatCard[] = [
  {
    title: "Completed",
    value: (rows) => String(countByStatus(rows, "Completed")),
    change: (rows) => `${countByStatus(rows, "Running")} running`,
    hint: "batches",
    description: "Successfully processed batches",
    tone: "success",
    icon: "briefcase",
  },
  {
    title: "Queued",
    value: (rows) => String(countByStatus(rows, "Queued")),
    change: (rows) => `${countByStatus(rows, "Failed")} failed`,
    hint: "pending",
    description: "Awaiting or failed processing",
    tone: "warning",
    icon: "clock",
  },
  {
    title: "Records",
    value: (rows) => {
      const total = rows.reduce((sum, row) => sum + Number(row.Records_processed ?? 0), 0);
      return String(total);
    },
    change: () => "processed",
    hint: "total",
    description: "Total records processed",
    tone: "info",
    icon: "users",
  },
];

export const SOURCES_STATS: AttendanceStatCard[] = [
  {
    title: "Active Sources",
    value: (rows) => String(countByStatus(rows, "Active")),
    change: (rows) => `${rows.length} configured`,
    hint: "total",
    description: "Enabled attendance sources",
    tone: "success",
    icon: "briefcase",
  },
  {
    title: "Device Sources",
    value: (rows) =>
      String(rows.filter((r) => String(r.Integration_type) === "Device").length),
    change: () => "biometric",
    hint: "sync",
    description: "Biometric machine integrations",
    tone: "info",
    icon: "clock",
  },
  {
    title: "API / Mobile",
    value: (rows) =>
      String(
        rows.filter((r) =>
          ["REST API", "Mobile App", "Web Portal"].includes(String(r.Integration_type)),
        ).length,
      ),
    change: () => "connected",
    hint: "channels",
    description: "Digital attendance channels",
    tone: "primary",
    icon: "users",
  },
];

export function enrichSourceRow(values: HrmsRow): HrmsRow {
  const enabled = values.Is_enabled === true || values.Is_enabled === "true" || values.Is_enabled === 1;
  return {
    ...values,
    Attendance_status: enabled ? "Active" : "Inactive",
  };
}

export function enrichRuleRow(values: HrmsRow): HrmsRow {
  return {
    ...values,
    Status: String(values.Status ?? "Active"),
  };
}

export function enrichProcessingRow(values: HrmsRow): HrmsRow {
  return {
    ...values,
    Batch_name: String(values.Batch_name ?? `Batch-${Date.now()}`),
  };
}

export function enrichMonthlyRow(values: HrmsRow, employees: HrmsRow[]): HrmsRow {
  const base = enrichEmployeeAttendanceRow(values, employees);
  return {
    ...base,
    Month_year: String(values.Month_year ?? "Aug 2026"),
    Attendance_status: String(values.Attendance_status ?? "Complete"),
  };
}
