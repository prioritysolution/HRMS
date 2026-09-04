"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnalyticsStatCard } from "@/components/dashboard/AnalyticsStatCard";
import { AttendancePercentageChart } from "@/components/dashboard/AttendancePercentageChart";
import { DepartmentCountChart } from "@/components/dashboard/DepartmentCountChart";
import { TodayAttendanceTable } from "@/components/dashboard/TodayAttendanceTable";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { useToast } from "@/components/ui/ToastProvider";
import {
  attendanceTrendToPercentages,
  dashboardService,
} from "@/lib/api/services/dashboard.service";
import type {
  DashboardOverview,
  DashboardSummaryMetric,
  DashboardTrend,
} from "@/lib/api/types";

type StatCardView = {
  title: string;
  value: string;
  change: string;
  hint: string;
  description: string;
  tone: "primary" | "danger" | "orange" | "success" | "warning" | "info";
  positive: boolean;
  trend: DashboardTrend;
  href: string;
};

const EMPTY_SUMMARY: DashboardSummaryMetric = {
  value: 0,
  change_percent: 0,
  trend: "flat",
  compare_label: "",
};

function formatChange(changePercent: number): string {
  const rounded = Math.round(changePercent * 10) / 10;
  const abs = Math.abs(rounded);
  const text = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  if (rounded > 0) return `+${text}%`;
  if (rounded < 0) return `-${text}%`;
  return "0%";
}

function isPositiveMetric(key: string, trend: DashboardTrend): boolean {
  const higherIsBetter = ["total_employees", "present_today", "on_probation"].includes(key);
  if (trend === "flat") return true;
  if (higherIsBetter) return trend === "up";
  return trend === "down";
}

function buildHint(key: string, metric: DashboardSummaryMetric): string {
  if (
    key === "total_employees" &&
    metric.active !== undefined &&
    metric.new !== undefined
  ) {
    return `${metric.active} Active, ${metric.new} New`;
  }
  return metric.compare_label || "";
}

function mapSummaryToCards(summary: DashboardOverview["summary"]): StatCardView[] {
  const configs: Array<{
    key: keyof DashboardOverview["summary"];
    title: string;
    description: string;
    tone: StatCardView["tone"];
    href: string;
  }> = [
    {
      key: "total_employees",
      title: "Total Employees",
      description: "Workforce headcount summary",
      tone: "primary",
      href: "/employees",
    },
    {
      key: "on_leave",
      title: "Employees on Leave",
      description: "Staff currently on approved leave",
      tone: "danger",
      href: "/leave/approval?status=Approved",
    },
    {
      key: "absent_today",
      title: "Employees Absent Today",
      description: "Employees marked as absent",
      tone: "orange",
      href: "/attendance/daily?status=Absent",
    },
    {
      key: "present_today",
      title: "Employees Present Today",
      description: "Employees marked as present",
      tone: "success",
      href: "/attendance/daily?status=Present",
    },
    {
      key: "late_today",
      title: "Late Employees",
      description: "Employees who arrived late",
      tone: "warning",
      href: "/attendance/daily?status=Late",
    },
    {
      key: "on_probation",
      title: "Employees on Probation",
      description: "Staff currently under probation",
      tone: "info",
      href: "/employees?Employment_status_name=Probation",
    },
  ];

  return configs.map((config) => {
    const metric = summary[config.key] ?? EMPTY_SUMMARY;
    return {
      title: config.title,
      value: String(metric.value ?? 0),
      change: formatChange(metric.change_percent ?? 0),
      hint: buildHint(config.key, metric),
      description: config.description,
      tone: config.tone,
      positive: isPositiveMetric(config.key, metric.trend),
      trend: metric.trend,
      href: config.href,
    };
  });
}

export default function DashboardPage() {
  const toast = useToast();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.overview({ limit: 50 });
      setOverview(data);
    } catch {
      setOverview(null);
      toast.error({ title: "Error", message: "Failed to load dashboard overview." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const emptySummary = {
    total_employees: EMPTY_SUMMARY,
    on_leave: EMPTY_SUMMARY,
    absent_today: EMPTY_SUMMARY,
    present_today: EMPTY_SUMMARY,
    late_today: EMPTY_SUMMARY,
    on_probation: EMPTY_SUMMARY,
  } satisfies DashboardOverview["summary"];

  const stats = mapSummaryToCards(overview?.summary ?? emptySummary);
  const attendanceTrend = attendanceTrendToPercentages(overview?.attendance_trend ?? []);
  const departmentCategories =
    overview?.department_distribution.map((row) => row.Dept_Name) ?? [];
  const departmentData =
    overview?.department_distribution.map((row) => row.Employee_count) ?? [];

  if (loading) {
    return (
      <>
        <PageHeader title="Employee Analytics" section="Dashboard" />
        <div className="container-fluid">
          <div className="employee-profile-loading">
            <RoundLoader />
            <p>Loading dashboard…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Employee Analytics" section="Dashboard" />
      <div className="container-fluid">
        {/* Row 1: stats + Attendance Percentage (matched height) */}
        <div className="dash-row mb-4">
          <div className="dash-stats-col">
            <div className="dash-stat-grid">
              {stats.map((stat, index) => (
                <AnalyticsStatCard key={stat.title} {...stat} iconIndex={index} />
              ))}
            </div>
          </div>
          <div className="dash-chart-col">
            <AttendancePercentageChart
              categories={attendanceTrend.categories}
              data={attendanceTrend.data}
            />
          </div>
        </div>

        {/* Row 2: Department distribution + Today's attendance */}
        <div className="dash-row">
          <div className="dash-satisfaction-col">
            <DepartmentCountChart
              categories={departmentCategories}
              data={departmentData}
            />
          </div>
          <div className="dash-table-col">
            <TodayAttendanceTable rows={overview?.today_attendance ?? []} />
          </div>
        </div>
      </div>
    </>
  );
}
