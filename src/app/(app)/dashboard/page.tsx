"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnalyticsStatCard } from "@/components/dashboard/AnalyticsStatCard";
import { AttendancePercentageChart } from "@/components/dashboard/AttendancePercentageChart";
import { TodayAttendanceTable } from "@/components/dashboard/TodayAttendanceTable";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/i18n";
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

function DashboardSkeleton() {
  return (
    <div className="dash-skeleton select-none" suppressHydrationWarning aria-busy="true">
      <div className="dash-row mb-4">
        <div className="dash-stats-col">
          <div className="dash-stat-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`dash-skel-stat-${i}`}
                className="analytics-stat-card border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] flex flex-col justify-between shadow-sm"
                style={{ minHeight: "135px" }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="ui-skeleton h-3.5 w-24 rounded-md" />
                    <div className="ui-skeleton h-7 w-20 rounded-lg" />
                  </div>
                  <div className="ui-skeleton w-11 h-11 rounded-2xl flex-shrink-0" />
                </div>
                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="ui-skeleton h-3 w-28 rounded" />
                  <div className="ui-skeleton h-3 w-12 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-chart-col">
          <div
            className="chart-card border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] flex flex-col justify-between h-full shadow-sm"
            style={{ minHeight: "300px" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="ui-skeleton h-4 w-36 rounded-md" />
              <div className="ui-skeleton h-3.5 w-20 rounded" />
            </div>
            <div className="flex items-end justify-between gap-3 h-48 pt-4 px-2">
              {[45, 75, 60, 95, 80, 70, 85].map((height, i) => (
                <div key={`chart-bar-${i}`} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="ui-skeleton w-full rounded-t-md"
                    style={{ height: `${height}%` }}
                  />
                  <div className="ui-skeleton h-2.5 w-7 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-row">
        <div className="dash-full-col">
          <div className="table-card border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="ui-skeleton h-5 w-40 rounded-md" />
              <div className="ui-skeleton h-8 w-32 rounded-lg" />
            </div>
            <div className="space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`table-skel-row-${i}`}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="ui-skeleton w-8 h-8 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5">
                      <div className="ui-skeleton h-3.5 w-32 rounded" />
                      <div className="ui-skeleton h-2.5 w-20 rounded" />
                    </div>
                  </div>
                  <div className="hidden sm:block ui-skeleton h-3.5 w-28 rounded" />
                  <div className="ui-skeleton h-3.5 w-16 rounded" />
                  <div className="ui-skeleton h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await dashboardService.overview({ limit: 50 });
        setOverview(data);
      } catch {
        if (mode === "initial") setOverview(null);
        toast.error({
          title: t("dashboard.errorTitle"),
          message: t("dashboard.loadError"),
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t, toast],
  );

  useEffect(() => {
    void loadOverview("initial");
  }, [loadOverview]);

  const emptySummary = {
    total_employees: EMPTY_SUMMARY,
    on_leave: EMPTY_SUMMARY,
    absent_today: EMPTY_SUMMARY,
    present_today: EMPTY_SUMMARY,
    late_today: EMPTY_SUMMARY,
    on_probation: EMPTY_SUMMARY,
  } satisfies DashboardOverview["summary"];

  const stats = useMemo((): StatCardView[] => {
    const summary = overview?.summary ?? emptySummary;
    const configs: Array<{
      key: keyof DashboardOverview["summary"];
      titleKey: string;
      descKey: string;
      tone: StatCardView["tone"];
      href: string;
    }> = [
      {
        key: "total_employees",
        titleKey: "dashboard.stats.totalEmployees",
        descKey: "dashboard.stats.totalEmployeesDesc",
        tone: "primary",
        href: "/employees",
      },
      {
        key: "on_leave",
        titleKey: "dashboard.stats.onLeave",
        descKey: "dashboard.stats.onLeaveDesc",
        tone: "danger",
        href: "/leave/approval?status=Approved",
      },
      {
        key: "absent_today",
        titleKey: "dashboard.stats.absentToday",
        descKey: "dashboard.stats.absentTodayDesc",
        tone: "orange",
        href: "/attendance/daily?status=Absent",
      },
      {
        key: "present_today",
        titleKey: "dashboard.stats.presentToday",
        descKey: "dashboard.stats.presentTodayDesc",
        tone: "success",
        href: "/attendance/daily?status=Present",
      },
      {
        key: "late_today",
        titleKey: "dashboard.stats.lateEmployees",
        descKey: "dashboard.stats.lateEmployeesDesc",
        tone: "warning",
        href: "/attendance/daily?status=Late",
      },
      {
        key: "on_probation",
        titleKey: "dashboard.stats.onProbation",
        descKey: "dashboard.stats.onProbationDesc",
        tone: "info",
        href: "/employees?Employment_status_name=Probation",
      },
    ];

    return configs.map((config) => {
      const metric = summary[config.key] ?? EMPTY_SUMMARY;
      let hint = metric.compare_label || "";
      if (
        config.key === "total_employees" &&
        metric.active !== undefined &&
        metric.new !== undefined
      ) {
        hint = t("dashboard.activeNewHint", {
          active: metric.active,
          new: metric.new,
        });
      }

      return {
        title: t(config.titleKey),
        value: String(metric.value ?? 0),
        change: formatChange(metric.change_percent ?? 0),
        hint,
        description: t(config.descKey),
        tone: config.tone,
        positive: isPositiveMetric(config.key, metric.trend),
        trend: metric.trend,
        href: config.href,
      };
    });
  }, [overview?.summary, t]);

  const attendanceTrend = attendanceTrendToPercentages(overview?.attendance_trend ?? []);

  const refreshAction = (
    <button
      type="button"
      className="btn btn-primary btn-sm rounded-md inline-flex items-center gap-2"
      onClick={() => void loadOverview("refresh")}
      disabled={loading || refreshing}
      aria-label={t("dashboard.refreshAria")}
    >
      <RefreshCw size={16} strokeWidth={2} className={refreshing ? "animate-spin" : ""} />
      {t("dashboard.refresh")}
    </button>
  );

  if (loading && !overview) {
    return (
      <>
        <PageHeader
          title={t("dashboard.title")}
          section={t("dashboard.section")}
          action={refreshAction}
        />
        <div className="container-fluid">
          <DashboardSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        section={t("dashboard.section")}
        action={refreshAction}
      />
      <div className="container-fluid">
        <div className="dash-row mb-4">
          <div className="dash-stats-col">
            <div className="dash-stat-grid">
              {stats.map((stat, index) => (
                <AnalyticsStatCard key={stat.href} {...stat} iconIndex={index} />
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

        <div className="dash-row">
          <div className="dash-full-col">
            <TodayAttendanceTable rows={overview?.today_attendance ?? []} />
          </div>
        </div>
      </div>
    </>
  );
}
