"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  ListTodo,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { useToast } from "@/components/ui/ToastProvider";
import {
  useI18n,
  translateHrmsLookup,
  translateGreeting,
  translateMonthName,
  formatLocalizedDateString,
  translateAttendanceStatus,
} from "@/i18n";
import { ApiError } from "@/lib/api/client";
import {
  dashboardService,
  empLeaveBalanceColor,
  empMonthlyAttendanceChartItems,
  empTimelineMarkerType,
} from "@/lib/api/services/dashboard.service";
import { authService } from "@/lib/api/services/auth.service";
import { getEssEmployeeName } from "@/lib/ess-utils";
import type { AuthMeProfile, EmpDashboard } from "@/lib/api/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const QUICK_LINK_DEFS = [
  { key: "quickApplyLeave" as const, href: "/leave/leave-requisition", icon: CalendarDays },
  { key: "quickDownloadPayslip" as const, href: "/ess/payslips", icon: Wallet },
  { key: "quickUpdateProfile" as const, href: "/ess/profile", icon: TrendingUp },
  { key: "quickSubmitRequest" as const, href: "/ess/requests", icon: ListTodo },
];

function formatDayNumber(value: number): string {
  const text = String(value);
  if (text.includes(".")) {
    const trimmed = text.replace(/\.?0+$/, "");
    return trimmed || "0";
  }
  return text;
}

type PresenceTone = "success" | "danger" | "warning" | "orange" | "muted";

function getPresenceTone(
  statusLabel: string,
  statusName?: string,
  statusCode?: number,
): PresenceTone {
  const text = `${statusLabel} ${statusName ?? ""}`.toLowerCase();
  if (text.includes("absent") || statusCode === 2) return "danger";
  if (text.includes("leave") || statusCode === 3) return "warning";
  if (text.includes("late") || statusCode === 4) return "orange";
  if (text.includes("present") || statusCode === 1) return "success";
  if (text.includes("holiday") || text.includes("week")) return "muted";
  return "muted";
}

function EssDashboardSkeleton() {
  return (
    <div className="ess-dashboard-skeleton select-none" suppressHydrationWarning aria-busy="true">
      <div className="ess-welcome-banner mb-4 border border-[var(--border)] rounded-2xl p-6 bg-[var(--card)] flex items-center justify-between">
        <div className="space-y-2">
          <div className="ui-skeleton h-7 w-48 rounded-lg" />
          <div className="ui-skeleton h-4 w-72 rounded-md" />
        </div>
        <div className="ui-skeleton h-9 w-36 rounded-xl hidden sm:block" />
      </div>

      <div className="ess-stat-grid ess-stat-grid--three mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`ess-stat-skel-${i}`}
            className="border border-[var(--border)] rounded-2xl p-5 bg-[var(--card)] flex items-center gap-4"
            style={{ minHeight: "92px" }}
          >
            <div className="ui-skeleton w-12 h-12 rounded-2xl flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="ui-skeleton h-6 w-24 rounded-md" />
              <div className="ui-skeleton h-3.5 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="ess-dashboard-grid ess-dashboard-grid--two mb-4">
        <div className="card border border-[var(--border)] rounded-2xl p-5 bg-[var(--card)]">
          <div className="flex items-center justify-between mb-5">
            <div className="ui-skeleton h-5 w-36 rounded-md" />
            <div className="ui-skeleton h-7 w-24 rounded-lg" />
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="ui-skeleton w-44 h-44 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--border)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`att-stat-skel-${i}`} className="space-y-1.5 text-center">
                <div className="ui-skeleton h-5 w-12 mx-auto rounded" />
                <div className="ui-skeleton h-3 w-16 mx-auto rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="card border border-[var(--border)] rounded-2xl p-5 bg-[var(--card)]">
          <div className="flex items-center justify-between mb-5">
            <div className="ui-skeleton h-5 w-32 rounded-md" />
            <div className="ui-skeleton h-7 w-20 rounded-lg" />
          </div>
          <div className="space-y-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`leave-skel-${i}`} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card-soft)] flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="ui-skeleton h-4 w-28 rounded" />
                  <div className="ui-skeleton h-3 w-20 rounded" />
                </div>
                <div className="ui-skeleton h-7 w-12 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EssDashboard() {
  const { language, t } = useI18n();
  const { error: toastError } = useToast();
  const [profile, setProfile] = useState<AuthMeProfile | null>(null);
  const [dashboard, setDashboard] = useState<EmpDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await authService.getMeProfile();
      setProfile(me);

      if (!me?.employeeId) {
        setDashboard(null);
        setError(t("ess.employeeNotLinked"));
        return;
      }

      const data = await dashboardService.empDashboard({
        employee_id: me.employeeId,
      });
      setDashboard(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t("ess.loadError");
      setDashboard(null);
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  }, [t, toastError]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const header = dashboard?.header;
  const summary = dashboard?.summary;
  const firstName =
    header?.employee_name ||
    getEssEmployeeName(profile).split(" ")[0] ||
    t("ess.nameFallback");
  const greeting = translateGreeting(language, header?.greeting || t("ess.greetingFallback"));
  const dateLabel = formatLocalizedDateString(language, header?.display_date || "");
  const subtitle = header?.subtitle
    ? translateHrmsLookup(language, "labels", header.subtitle)
    : t("ess.subtitleFallback");

  const attendanceItems = useMemo(() => {
    const items = empMonthlyAttendanceChartItems(dashboard?.monthly_attendance ?? null);
    const labelMap: Record<string, string> = {
      Present: t("ess.present"),
      Absent: t("ess.absent"),
      Leave: t("ess.leave"),
      Holiday: t("ess.holiday"),
    };
    return items.map((item) => ({
      ...item,
      label: labelMap[item.label] ?? item.label,
    }));
  }, [dashboard?.monthly_attendance, t]);

  const salaryHistory = dashboard?.salary_history ?? [];
  const leaveBalances = dashboard?.leave_balances ?? [];
  const timeline = dashboard?.timeline ?? [];
  const lastPayslip = dashboard?.last_payslip ?? null;

  const salaryChartOptions = useMemo(
    () => ({
      chart: {
        type: "area" as const,
        toolbar: { show: false },
        fontFamily: "Nunito, sans-serif",
        sparkline: { enabled: false },
      },
      stroke: { curve: "smooth" as const, width: 3 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: "#eef0f6",
        strokeDashArray: 4,
        padding: { left: 4, right: 8 },
      },
      xaxis: {
        categories: salaryHistory.map((p) => p.month),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#65688a", fontWeight: 600 } },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => `₹${(val / 1000).toFixed(0)}k`,
          style: { colors: "#65688a", fontWeight: 600 },
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `₹${val.toLocaleString("en-IN")}`,
        },
      },
      colors: ["#4666e1"],
      markers: {
        size: 4,
        colors: ["#fff"],
        strokeColors: "#4666e1",
        strokeWidth: 2,
      },
    }),
    [salaryHistory],
  );

  const attendanceChartOptions = useMemo(() => {
    const maxValue = Math.max(...attendanceItems.map((i) => i.value), 0);
    return {
      chart: {
        type: "bar" as const,
        toolbar: { show: false },
        fontFamily: "Nunito, sans-serif",
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: "58%",
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        textAnchor: "start" as const,
        offsetX: 8,
        style: { colors: ["#0d2042"], fontWeight: 700, fontSize: "12px" },
        formatter: (val: number) => `${val}`,
      },
      grid: {
        borderColor: "#eef0f6",
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      xaxis: {
        categories: attendanceItems.map((i) => i.label),
        max: maxValue + 4,
        labels: { style: { colors: "#65688a", fontWeight: 600 } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { colors: "#0d2042", fontWeight: 700 } },
      },
      legend: { show: false },
      colors: attendanceItems.map((i) => i.color),
      tooltip: {
        y: {
          formatter: (val: number) => t("ess.daysUnit", { count: val }),
        },
      },
    };
  }, [attendanceItems, t]);

  if (loading) {
    return (
      <>
        <PageHeader title={t("ess.dashboardTitle")} section={t("ess.section")} />
        <div className="container-fluid">
          <EssDashboardSkeleton />
        </div>
      </>
    );
  }

  if (error || !dashboard || !summary) {
    return (
      <>
        <PageHeader title={t("ess.dashboardTitle")} section={t("ess.section")} />
        <div className="container-fluid">
          <div className="card">
            <div className="card-body ess-dashboard-empty">
              <p className="mb-3">{error || t("ess.noData")}</p>
              <button type="button" className="btn btn-primary" onClick={() => void loadDashboard()}>
                {t("common.retry")}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const rawMonthLabel = dashboard.monthly_attendance?.Month_name || t("ess.thisMonth");
  const monthLabel = translateMonthName(language, rawMonthLabel);
  const presenceTone = getPresenceTone(
    summary.attendance_status_label,
    summary.attendance_status_name,
    summary.attendance_status,
  );

  return (
    <>
      <PageHeader title={t("ess.dashboardTitle")} section={t("ess.section")} />
      <div className="container-fluid">
        <div className="ess-welcome-banner mb-4">
          <div>
            <h2>
              {greeting}, {firstName}{" "}
              <span aria-hidden="true">👋</span>
            </h2>
            <p>{subtitle}</p>
          </div>
          {dateLabel ? (
            <div className="ess-welcome-date">
              <CalendarDays size={18} />
              <span>{dateLabel}</span>
            </div>
          ) : null}
        </div>

        <div className="ess-stat-grid ess-stat-grid--three mb-4">
          <div className={`ess-stat-card ess-stat-card--${presenceTone}`}>
            <div
              className={`ess-stat-card-icon ess-presence-dot-wrap ess-presence-dot-wrap--${presenceTone}`}
            >
              <span className={`ess-presence-dot ess-presence-dot--${presenceTone}`} />
            </div>
            <div className="ess-stat-card-body">
              <strong
                className={`ess-stat-card-value ess-presence-status ess-presence-status--${presenceTone}`}
              >
                {translateAttendanceStatus(language, summary.attendance_status_label)}
              </strong>
              <small>
                {t("ess.checkOut")} · {summary.scheduled_check_out}
              </small>
            </div>
          </div>

          <div className="ess-stat-card ess-stat-card--primary">
            <div className="ess-stat-card-icon">
              <Clock3 size={24} />
            </div>
            <div className="ess-stat-card-body">
              <strong className="ess-stat-card-value">
                {summary.working_hours_label.replace(
                  "Hrs",
                  language === "bn" ? "ঘণ্টা" : language === "hi" ? "घंटे" : language === "or" ? "ଘଣ୍ଟା" : "Hrs",
                )}
              </strong>
              <span className="ess-stat-card-label">{t("ess.workingToday")}</span>
            </div>
          </div>

          <Link href="/ess/leave" className="ess-stat-card ess-stat-card--info">
            <div className="ess-stat-card-icon">
              <Briefcase size={24} />
            </div>
            <div className="ess-stat-card-body">
              <strong className="ess-stat-card-value">
                {t("ess.daysUnit", { count: summary.total_leaves_left })}
              </strong>
              <span className="ess-stat-card-label">{t("ess.leaveLeft")}</span>
            </div>
          </Link>
        </div>

        <div className="ess-dashboard-grid ess-dashboard-grid--two mb-4">
          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">{t("ess.attendance")}</h5>
                <Link href="/ess/attendance" className="ess-link-sm">
                  {t("ess.viewAll")} <ArrowRight size={14} />
                </Link>
              </div>

              {timeline.length > 0 ? (
                <ul className="ess-attendance-timeline">
                  {timeline.map((item) => (
                    <li
                      key={item.Punch_id}
                      className={`ess-timeline-item ess-timeline-item--${empTimelineMarkerType(item)}`}
                    >
                      <span className="ess-timeline-marker" />
                      <div className="ess-timeline-content">
                        <strong>{item.Event_time_display}</strong>
                        <span>{translateHrmsLookup(language, "labels", item.Event_label)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mb-0">{t("ess.noPunches")}</p>
              )}
            </div>
          </div>

          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">{t("ess.leaveBalance")}</h5>
                <Link href="/ess/leave" className="ess-link-sm">
                  {t("ess.details")} <ArrowRight size={14} />
                </Link>
              </div>

              {leaveBalances.length > 0 ? (
                <div className="ess-leave-bars">
                  {leaveBalances.map((leave, index) => {
                    const pct =
                      leave.Used_Percent > 0
                        ? Math.min(100, Math.round(leave.Used_Percent))
                        : leave.Total_Days > 0
                          ? Math.min(100, Math.round((leave.Used_Days / leave.Total_Days) * 100))
                          : 0;
                    return (
                      <div key={leave.Leave_Id} className="ess-leave-bar-row">
                        <div className="ess-leave-bar-meta">
                          <span>{translateHrmsLookup(language, "labels", leave.Leave_Name)}</span>
                          <strong>
                            {formatDayNumber(leave.Used_Days)} / {formatDayNumber(leave.Total_Days)}
                          </strong>
                        </div>
                        <div className="ess-leave-bar-track">
                          <div
                            className="ess-leave-bar-fill"
                            style={{ width: `${pct}%`, background: empLeaveBalanceColor(index) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted mb-3">{t("ess.noLeaveBalance")}</p>
              )}

              <Link
                href="/leave/leave-requisition"
                className="btn btn-primary ess-card-action u-width-full"
              >
                <CalendarDays size={16} />
                {t("ess.applyLeave")}
              </Link>
            </div>
          </div >
        </div >

        <div className="ess-dashboard-grid ess-dashboard-grid--two mb-4">
          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">{t("ess.lastPayslip")}</h5>
                <Link href="/ess/payslips" className="ess-link-sm">
                  {t("ess.allPayslips")} <ArrowRight size={14} />
                </Link>
              </div>

              {lastPayslip ? (
                <>
                  <div className="ess-payslip-hero">
                    <div>
                      <span className="ess-payslip-period">{lastPayslip.period}</span>
                      <p className="ess-payslip-label">{t("ess.netSalary")}</p>
                      <strong className="ess-payslip-amount">
                        ₹ {lastPayslip.net_salary.toLocaleString("en-IN")}
                      </strong>
                      <small className="ess-payslip-paid">
                        {t("ess.paidOn")} {lastPayslip.paid_on}
                      </small>
                    </div>
                    <span className="ess-payslip-badge">{translateHrmsLookup(language, "labels", lastPayslip.status)}</span>
                  </div>

                  {salaryHistory.length > 0 ? (
                    <div className="ess-chart-wrap ess-chart-wrap--salary">
                      <Chart
                        type="area"
                        height={180}
                        width="100%"
                        options={salaryChartOptions}
                        series={[
                          {
                            name: t("ess.netPay"),
                            data: salaryHistory.map((p) => p.net_pay),
                          },
                        ]}
                      />
                    </div>
                  ) : null}

                  <div className="ess-payslip-actions">
                    <Link href="/ess/payslips" className="btn btn-outline-primary ess-card-action">
                      <FileText size={16} />
                      {t("ess.viewPayslip")}
                    </Link>
                    <Link href="/ess/payslips" className="btn btn-primary ess-card-action">
                      <Download size={16} />
                      {t("ess.download")}
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-muted mb-0">{t("ess.noPayslip")}</p>
              )}
            </div>
          </div>

          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">
                  {t("ess.attendanceMonth", { month: monthLabel })}
                </h5>
                <Link href="/ess/attendance" className="ess-link-sm">
                  {t("ess.details")} <ArrowRight size={14} />
                </Link>
              </div>

              {attendanceItems.length > 0 ? (
                <>
                  <div className="ess-chart-wrap">
                    <Chart
                      type="bar"
                      height={260}
                      width="100%"
                      options={attendanceChartOptions}
                      series={[
                        {
                          name: t("ess.days"),
                          data: attendanceItems.map((i) => i.value),
                        },
                      ]}
                    />
                  </div>

                  <div className="ess-attendance-legend">
                    {attendanceItems.map((item) => (
                      <div key={item.label} className="ess-attendance-legend-item">
                        <span style={{ background: item.color }} />
                        <em>{item.label}</em>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted mb-0">{t("ess.noMonthlyAttendance")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">{t("ess.employeeServices")}</h5>
            <div className="ess-quick-links">
              {QUICK_LINK_DEFS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="ess-quick-link">
                    <Icon size={20} />
                    <span>{t(`ess.${link.key}`)}</span>
                    <ArrowRight size={16} className="ess-quick-link-arrow" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
