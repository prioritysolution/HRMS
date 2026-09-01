import type { LeaveStatCard } from "@/components/leave/LeaveModulePage";
import { countByLeaveStatus } from "@/lib/leave-module-utils";

export const APPLICATION_STATS: LeaveStatCard[] = [
  {
    title: "Pending",
    value: (rows) => String(countByLeaveStatus(rows, "Pending")),
    change: (rows) => `${countByLeaveStatus(rows, "Approved")} approved`,
    hint: "requests",
    description: "Awaiting manager approval",
    tone: "warning",
    icon: "clock",
  },
  {
    title: "Approved",
    value: (rows) => String(countByLeaveStatus(rows, "Approved")),
    change: (rows) => `${countByLeaveStatus(rows, "Rejected")} rejected`,
    hint: "this month",
    description: "Approved leave applications",
    tone: "success",
    icon: "users",
  },
  {
    title: "Total Days",
    value: (rows) => {
      const total = rows.reduce((sum, row) => sum + Number(row.Number_of_days ?? 0), 0);
      return String(total);
    },
    change: () => "applied",
    hint: "days",
    description: "Leave days in all applications",
    tone: "info",
    icon: "calendar",
  },
];

export const APPROVAL_STATS: LeaveStatCard[] = [
  {
    title: "Pending Approval",
    value: (rows) => String(countByLeaveStatus(rows, "Pending")),
    change: (rows) => `${countByLeaveStatus(rows, "Approved")} approved`,
    hint: "queue",
    description: "Requests waiting for action",
    tone: "warning",
    icon: "clock",
  },
  {
    title: "Approved",
    value: (rows) => String(countByLeaveStatus(rows, "Approved")),
    change: (rows) => `${countByLeaveStatus(rows, "Rejected")} rejected`,
    hint: "processed",
    description: "Approved leave requests",
    tone: "success",
    icon: "users",
  },
  {
    title: "Days to Review",
    value: (rows) => {
      const pending = rows.filter(
        (row) => String(row.Approval_status ?? "").toLowerCase() === "pending",
      );
      const total = pending.reduce((sum, row) => sum + Number(row.Number_of_days ?? 0), 0);
      return String(total);
    },
    change: () => "pending",
    hint: "days",
    description: "Leave days in pending queue",
    tone: "primary",
    icon: "calendar",
  },
];

export const ALLOCATION_STATS: LeaveStatCard[] = [
  {
    title: "Employees",
    value: (rows) => String(new Set(rows.map((row) => row.Employee_code)).size),
    change: (rows) => `${rows.length} allocations`,
    hint: "covered",
    description: "Employees with leave balance",
    tone: "info",
    icon: "users",
  },
  {
    title: "Total Balance",
    value: (rows) => {
      const total = rows.reduce((sum, row) => sum + Number(row.Balance_days ?? 0), 0);
      return String(total);
    },
    change: () => "days",
    hint: "remaining",
    description: "Combined leave balance",
    tone: "success",
    icon: "calendar",
  },
  {
    title: "Used Days",
    value: (rows) => {
      const total = rows.reduce((sum, row) => sum + Number(row.Used_days ?? 0), 0);
      return String(total);
    },
    change: () => "consumed",
    hint: "YTD",
    description: "Leave days used this year",
    tone: "primary",
    icon: "briefcase",
  },
];
