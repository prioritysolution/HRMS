"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  ListTodo,
  Megaphone,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SoftStatus } from "@/components/ui/DataTable";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { getEssDashboardData } from "@/data/ess-mock";
import { authService } from "@/lib/api/services/auth.service";
import { getEssEmployeeCode, getEssEmployeeName } from "@/lib/ess-utils";
import { formatDateDisplay } from "@/lib/date-utils";
import type { AuthMeProfile } from "@/lib/api/types";

const quickLinks = [
  { label: "Apply Leave", href: "/ess/leave/apply", icon: CalendarDays },
  { label: "Download Payslip", href: "/ess/payslips", icon: Wallet },
  { label: "Update Profile", href: "/ess/profile", icon: TrendingUp },
  { label: "Submit Request", href: "/ess/requests", icon: ListTodo },
];

export function EssDashboard() {
  const [profile, setProfile] = useState<AuthMeProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
  const data = getEssDashboardData(employeeCode);

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
            <h2>Welcome back, {employeeName.split(" ")[0]}!</h2>
            <p>Here&apos;s your snapshot for today — attendance, leave, pay, and tasks at a glance.</p>
          </div>
          <div className="ess-welcome-date">
            <CalendarDays size={18} />
            <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>

        {/* Stat cards row */}
        <div className="ess-stat-grid mb-4">
          <Link href="/ess/attendance" className="ess-stat-card ess-stat-card--primary">
            <div className="ess-stat-card-icon">
              <Clock3 size={24} />
            </div>
            <div className="ess-stat-card-body">
              <span className="ess-stat-card-label">Today&apos;s Attendance</span>
              <strong className="ess-stat-card-value">
                {String(data.todayAttendance?.Attendance_status ?? "Not marked")}
              </strong>
              <small>
                {data.todayAttendance
                  ? `${String(data.todayAttendance.Check_in ?? "—")} – ${String(data.todayAttendance.Check_out ?? "—")}`
                  : "Check in to mark attendance"}
              </small>
            </div>
          </Link>

          <Link href="/ess/attendance" className="ess-stat-card ess-stat-card--success">
            <div className="ess-stat-card-icon">
              <CheckCircle2 size={24} />
            </div>
            <div className="ess-stat-card-body">
              <span className="ess-stat-card-label">Monthly Attendance</span>
              <strong className="ess-stat-card-value">
                {String(data.monthlyAttendance?.Present_days ?? 0)} days
              </strong>
              <small>
                {String(data.monthlyAttendance?.Month_year ?? "Current month")} ·{" "}
                {String(data.monthlyAttendance?.Late_days ?? 0)} late days
              </small>
            </div>
          </Link>

          <Link href="/ess/leave" className="ess-stat-card ess-stat-card--info">
            <div className="ess-stat-card-icon">
              <CalendarDays size={24} />
            </div>
            <div className="ess-stat-card-body">
              <span className="ess-stat-card-label">Leave Balance</span>
              <strong className="ess-stat-card-value">{data.totalLeaveBalance} days</strong>
              <small>{data.leaveBalance.length} leave types allocated</small>
            </div>
          </Link>

          <Link href="/ess/leave" className="ess-stat-card ess-stat-card--warning">
            <div className="ess-stat-card-icon">
              <Bell size={24} />
            </div>
            <div className="ess-stat-card-body">
              <span className="ess-stat-card-label">Pending Leave</span>
              <strong className="ess-stat-card-value">{data.pendingLeave.length}</strong>
              <small>Applications awaiting approval</small>
            </div>
          </Link>
        </div>

        <div className="ess-dashboard-grid mb-4">
          {/* Salary info */}
          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">
                  <IndianRupee size={18} className="ess-card-header-icon" />
                  Salary Information
                </h5>
                <Link href="/ess/payslips" className="ess-link-sm">
                  View payslips <ArrowRight size={14} />
                </Link>
              </div>
              {data.payslip ? (
                <div className="ess-salary-summary">
                  <div className="ess-salary-row">
                    <span>Gross Pay</span>
                    <strong>₹{Number(data.payslip.Gross_pay).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="ess-salary-row">
                    <span>Deductions</span>
                    <span>₹{Number(data.payslip.Total_deductions).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="ess-salary-row ess-salary-row--highlight">
                    <span>Net Pay ({String(data.payslip.Payroll_month)})</span>
                    <strong>₹{Number(data.payslip.Net_pay).toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="mt-3">
                    <SoftStatus value={String(data.payslip.Bank_transfer_status ?? "Pending")} />
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0">No payslip available for the current period.</p>
              )}
            </div>
          </div>

          {/* Performance */}
          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">
                  <Star size={18} className="ess-card-header-icon" />
                  Performance Status
                </h5>
                <Link href="/ess/performance" className="ess-link-sm">
                  View details <ArrowRight size={14} />
                </Link>
              </div>
              {data.performance ? (
                <div className="ess-performance-summary">
                  <div className="ess-performance-score">
                    <span className="ess-performance-number">{String(data.performance.Score ?? "—")}</span>
                    <span className="ess-performance-max">/ 5</span>
                  </div>
                  <p className="ess-performance-rating">{String(data.performance.Overall_rating)}</p>
                  <p className="text-muted mb-0">
                    {String(data.performance.Review_period)} · Goals: {String(data.performance.Goals_completed)}
                  </p>
                </div>
              ) : (
                <p className="text-muted mb-0">No performance review on record.</p>
              )}
            </div>
          </div>

          {/* Upcoming holidays */}
          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">
                  <CalendarDays size={18} className="ess-card-header-icon" />
                  Upcoming Holidays
                </h5>
                <Link href="/ess/holidays" className="ess-link-sm">
                  Full calendar <ArrowRight size={14} />
                </Link>
              </div>
              <ul className="ess-holiday-list">
                {data.holidays.length > 0 ? (
                  data.holidays.map((h) => (
                    <li key={String(h.id)}>
                      <span className="ess-holiday-date">
                        {formatDateDisplay(String(h.Holiday_date))}
                      </span>
                      <span className="ess-holiday-name">{String(h.Holiday_name)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted">No upcoming holidays.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="ess-dashboard-grid mb-4">
          {/* Announcements */}
          <div className="card ess-dashboard-card ess-dashboard-card--wide">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">
                  <Megaphone size={18} className="ess-card-header-icon" />
                  Announcements
                </h5>
              </div>
              <div className="ess-announcement-list">
                {data.announcements.map((ann) => (
                  <div key={String(ann.id)} className="ess-announcement-item">
                    <div className="ess-announcement-meta">
                      <SoftStatus value={String(ann.Priority ?? "Normal")} />
                      <span className="text-muted">{formatDateDisplay(String(ann.Published_on))}</span>
                    </div>
                    <h6>{String(ann.Title)}</h6>
                    <p>{String(ann.Summary)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="card ess-dashboard-card">
            <div className="card-body">
              <div className="ess-card-header">
                <h5 className="card-title mb-0">
                  <ListTodo size={18} className="ess-card-header-icon" />
                  Tasks
                </h5>
              </div>
              <ul className="ess-task-list">
                {data.tasks.map((task) => (
                  <li key={String(task.id)} className={task.Status === "Completed" ? "ess-task-done" : ""}>
                    <div className="ess-task-check">
                      {task.Status === "Completed" ? <CheckCircle2 size={16} /> : <span className="ess-task-dot" />}
                    </div>
                    <div>
                      <strong>{String(task.Task_title)}</strong>
                      <small className="text-muted d-block">
                        Due {formatDateDisplay(String(task.Due_date))} · {String(task.Category)}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
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
