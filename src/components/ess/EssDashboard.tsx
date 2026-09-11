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
import { getEssDashboardData } from "@/data/ess-mock";
import { authService } from "@/lib/api/services/auth.service";
import { getEssEmployeeCode, getEssEmployeeName } from "@/lib/ess-utils";
import type { AuthMeProfile } from "@/lib/api/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const quickLinks = [
  { label: "Apply Leave", href: "/leave/leave-requisition", icon: CalendarDays },
  { label: "Download Payslip", href: "/ess/payslips", icon: Wallet },
  { label: "Update Profile", href: "/ess/profile", icon: TrendingUp },
  { label: "Submit Request", href: "/ess/requests", icon: ListTodo },
];

function getGreeting(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function EssDashboard() {
  const [profile, setProfile] = useState<AuthMeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => new Date());

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const me = await authService.getMeProfile();
      setProfile(me);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const employeeCode = getEssEmployeeCode(null, profile);
  const employeeName = getEssEmployeeName(profile);
  const firstName = employeeName.split(" ")[0] || "there";
  const data = getEssDashboardData(employeeCode);
  const mock = data.mock;

  const dateLabel = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const leaveRemaining = useMemo(
    () => mock.leaveBalances.reduce((sum, item) => sum + (item.total - item.used), 0),
    [mock.leaveBalances],
  );

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
        categories: mock.salaryTrend.map((p) => p.month),
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
          formatter: (val: number) =>
            `₹${val.toLocaleString("en-IN")}`,
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
    [mock.salaryTrend],
  );

  const attendanceChartOptions = useMemo(
    () => ({
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
        categories: mock.monthlyAttendance.items.map((i) => i.label),
        max: Math.max(...mock.monthlyAttendance.items.map((i) => i.value)) + 4,
        labels: { style: { colors: "#65688a", fontWeight: 600 } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { colors: "#0d2042", fontWeight: 700 } },
      },
      legend: { show: false },
      colors: mock.monthlyAttendance.items.map((i) => i.color),
      tooltip: {
        y: { formatter: (val: number) => `${val} days` },
      },
    }),
    [mock.monthlyAttendance.items],
  );

  if (loading) {
    return (
      <>
        <PageHeader title="My Dashboard" section="Employee Self Service" />
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
      <PageHeader title="My Dashboard" section="Employee Self Service" />
      <div className="container-fluid">
        <div className="ess-welcome-banner mb-4">
          <div>
            <h2>
              {getGreeting(now.getHours())}, {firstName}{" "}
              <span aria-hidden="true">👋</span>
            </h2>
            <p>Your attendance, leave, and payslip snapshot for today.</p>
          </div>
          <div className="ess-welcome-date">
            <CalendarDays size={18} />
            <span>{dateLabel}</span>
          </div>
        </div>

        {/* Top summary cards */}
        <div className="ess-stat-grid ess-stat-grid--three mb-4">
          <div className="ess-stat-card ess-stat-card--success">
            <div className="ess-stat-card-icon ess-presence-dot-wrap">
              <span className="ess-presence-dot" />
            </div>
            <div className="ess-stat-card-body">
              <strong className="ess-stat-card-value ess-presence-status">
                {mock.presenceStatus}
              </strong>
              <small>Check-out · {mock.expectedCheckout}</small>
            </div>
          </div>

          <div className="ess-stat-card ess-stat-card--primary">
            <div className="ess-stat-card-icon">
              <Clock3 size={24} />
            </div>
            <div className="ess-stat-card-body">
              <strong className="ess-stat-card-value">{mock.workingTodayHours} Hrs</strong>
              <span className="ess-stat-card-label">Working Today</span>
            </div>
          </div>

          <Link href="/ess/leave" className="ess-stat-card ess-stat-card--info">
            <div className="ess-stat-card-icon">
              <Briefcase size={24} />
            </div>
            <div className="ess-stat-card-body">
              <strong className="ess-stat-card-value">{mock.leaveLeftDays} Days</strong>
              <span className="ess-stat-card-label">Leave Left</span>
              <small>{leaveRemaining} days remaining across types</small>
            </div>
          </Link>
        </div>

        {/* Attendance log + Leave balance */}
        <div className="ess-dashboard-grid ess-dashboard-grid--two mb-4">
          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">Attendance</h5>
                <Link href="/ess/attendance" className="ess-link-sm">
                  View all <ArrowRight size={14} />
                </Link>
              </div>

              <ul className="ess-attendance-timeline">
                {mock.attendanceLog.map((item) => (
                  <li key={`${item.time}-${item.label}`} className={`ess-timeline-item ess-timeline-item--${item.type}`}>
                    <span className="ess-timeline-marker" />
                    <div className="ess-timeline-content">
                      <strong>{item.time}</strong>
                      <span>{item.label}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">My Leave Balance</h5>
                <Link href="/ess/leave" className="ess-link-sm">
                  Details <ArrowRight size={14} />
                </Link>
              </div>

              <div className="ess-leave-bars">
                {mock.leaveBalances.map((leave) => {
                  const pct = Math.min(100, Math.round((leave.used / leave.total) * 100));
                  return (
                    <div key={leave.code} className="ess-leave-bar-row">
                      <div className="ess-leave-bar-meta">
                        <span>{leave.type}</span>
                        <strong>
                          {leave.used} / {leave.total}
                        </strong>
                      </div>
                      <div className="ess-leave-bar-track">
                        <div
                          className="ess-leave-bar-fill"
                          style={{ width: `${pct}%`, background: leave.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link href="/leave/leave-requisition" className="btn btn-primary ess-card-action w-100">
                <CalendarDays size={16} />
                Apply Leave
              </Link>
            </div>
          </div>
        </div>

        {/* Payslip trend + Monthly attendance chart */}
        <div className="ess-dashboard-grid ess-dashboard-grid--two mb-4">
          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">Last Payslip</h5>
                <Link href="/ess/payslips" className="ess-link-sm">
                  All payslips <ArrowRight size={14} />
                </Link>
              </div>

              <div className="ess-payslip-hero">
                <div>
                  <span className="ess-payslip-period">{mock.lastPayslip.period}</span>
                  <p className="ess-payslip-label">Net Salary</p>
                  <strong className="ess-payslip-amount">
                    ₹ {mock.lastPayslip.netSalary.toLocaleString("en-IN")}
                  </strong>
                  <small className="ess-payslip-paid">
                    Paid on: {mock.lastPayslip.paidOn}
                  </small>
                </div>
                <span className="ess-payslip-badge">{mock.lastPayslip.status}</span>
              </div>

              <div className="ess-chart-wrap ess-chart-wrap--salary">
                <Chart
                  type="area"
                  height={180}
                  width="100%"
                  options={salaryChartOptions}
                  series={[
                    {
                      name: "Net Pay",
                      data: mock.salaryTrend.map((p) => p.netPay),
                    },
                  ]}
                />
              </div>

              <div className="ess-payslip-actions">
                <Link href="/ess/payslips" className="btn btn-outline-primary ess-card-action">
                  <FileText size={16} />
                  View Payslip
                </Link>
                <button type="button" className="btn btn-primary ess-card-action">
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          </div>

          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">
                  Attendance — {mock.monthlyAttendance.monthLabel}
                </h5>
                <Link href="/ess/attendance" className="ess-link-sm">
                  Details <ArrowRight size={14} />
                </Link>
              </div>

              <div className="ess-chart-wrap">
                <Chart
                  type="bar"
                  height={260}
                  width="100%"
                  options={attendanceChartOptions}
                  series={[
                    {
                      name: "Days",
                      data: mock.monthlyAttendance.items.map((i) => i.value),
                    },
                  ]}
                />
              </div>

              <div className="ess-attendance-legend">
                {mock.monthlyAttendance.items.map((item) => (
                  <div key={item.label} className="ess-attendance-legend-item">
                    <span style={{ background: item.color }} />
                    <em>{item.label}</em>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="card">
          <div className="card-body">
            <h5 className="card-title mb-3">Employee Services</h5>
            <div className="ess-quick-links">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="ess-quick-link">
                    <Icon size={20} />
                    <span>{link.label}</span>
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
