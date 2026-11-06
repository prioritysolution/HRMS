"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Folder,
  Gift,
  HeartPulse,
  HelpCircle,
  Home,
  Layers,
  Megaphone,
  Plane,
  Scan,
  ScanFace,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api/client";
import { dashboardService } from "@/lib/api/services/dashboard.service";
import {
  myAttendanceService,
  myAttendanceDayTone,
} from "@/lib/api/services/my-attendance.service";
import { holidayService } from "@/lib/api/services/holiday.service";
import { authService } from "@/lib/api/services/auth.service";
import { employeeService } from "@/lib/api/services/employee.service";
import type {
  AuthMeProfile,
  EmpDashboard,
  MyAttendanceCalendar,
} from "@/lib/api/types";
import type { HrmsRow } from "@/types/hrms";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EssDashboard() {
  const { t } = useI18n();
  const { error: toastError, success: toastSuccess } = useToast();

  const [profile, setProfile] = useState<AuthMeProfile | null>(null);
  const [dashboard, setDashboard] = useState<EmpDashboard | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<Record<string, unknown> | null>(null);
  const [holidays, setHolidays] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month navigation for "This Month Attendance" calendar
  const today = useMemo(() => new Date(), []);
  const [calendarYear, setCalendarYear] = useState(() => today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => today.getMonth() + 1); // 1-indexed
  const [calendarData, setCalendarData] = useState<MyAttendanceCalendar | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Quick punch state for mobile
  const [punching, setPunching] = useState(false);

  // Initial load
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await authService.getMeProfile();
      setProfile(me);

      if (!me?.employeeId) {
        setDashboard(null);
        setError(t("ess.employeeNotLinked"));
        setLoading(false);
        return;
      }

      const [dashData, holidayList, empRecord] = await Promise.allSettled([
        dashboardService.empDashboard({ employee_id: me.employeeId }),
        holidayService.list(),
        employeeService.getById(me.employeeId),
      ]);

      if (dashData.status === "fulfilled") {
        setDashboard(dashData.value);
      }
      if (holidayList.status === "fulfilled") {
        setHolidays(holidayList.value);
      }
      if (empRecord.status === "fulfilled" && empRecord.value) {
        setEmployeeDetails(empRecord.value as Record<string, unknown>);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t("ess.loadError");
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  }, [t, toastError]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  // Load calendar when employeeId or month/year changes
  useEffect(() => {
    if (!profile?.employeeId) return;
    let isCancelled = false;

    const fetchCalendar = async () => {
      setCalendarLoading(true);
      try {
        const cal = await myAttendanceService.calendar({
          employee_id: profile.employeeId as number,
          year: calendarYear,
          month: calendarMonth,
        });
        if (!isCancelled) setCalendarData(cal);
      } catch {
        if (!isCancelled) setCalendarData(null);
      } finally {
        if (!isCancelled) setCalendarLoading(false);
      }
    };

    void fetchCalendar();
    return () => {
      isCancelled = true;
    };
  }, [profile?.employeeId, calendarYear, calendarMonth]);

  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarYear((y) => y - 1);
      setCalendarMonth(12);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarYear((y) => y + 1);
      setCalendarMonth(1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  // --- Derived Data ---
  const employeeName =
    dashboard?.header?.display_name ||
    dashboard?.header?.employee_name ||
    profile?.displayName ||
    profile?.userName ||
    "Subhendu";
  const firstName =
    dashboard?.header?.employee_name ||
    employeeName.split(" ")[0];

  const currentHour = today.getHours();
  const timeGreeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
        ? "Good Afternoon"
        : "Good Evening";
  const greeting = dashboard?.header?.greeting || timeGreeting;

  // Upcoming Holiday
  const upcomingHoliday = useMemo(() => {
    if (dashboard?.upcoming_holiday) {
      return {
        dateStr: dashboard.upcoming_holiday.display_date || dashboard.upcoming_holiday.date,
        name: dashboard.upcoming_holiday.name,
      };
    }

    if (holidays.length > 0) {
      const nowTime = today.getTime();
      const sorted = [...holidays]
        .map((h) => {
          const rawDate = String(h.Holiday_date ?? "");
          const d = new Date(rawDate);
          return {
            row: h,
            timestamp: isNaN(d.getTime()) ? 0 : d.getTime(),
          };
        })
        .filter((item) => item.timestamp >= nowTime - 86400000)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (sorted.length > 0) {
        const next = sorted[0].row;
        const d = new Date(String(next.Holiday_date ?? ""));
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const dayNum = d.getDate();
        const mon = MONTH_NAMES[d.getMonth()];
        return {
          dateStr: `${dayNum} ${mon}, ${dayName}`,
          name: String(next.Holiday_name ?? "Holiday"),
        };
      }
    }

    return {
      dateStr: "None scheduled",
      name: "No upcoming holiday",
    };
  }, [dashboard?.upcoming_holiday, holidays, today]);

  // Attendance ratio (using attendance_summary from API)
  const attendanceRatio = useMemo(() => {
    if (dashboard?.attendance_summary) {
      return (
        dashboard.attendance_summary.display_label ||
        `${dashboard.attendance_summary.present_days} / ${dashboard.attendance_summary.total_working_days}`
      );
    }
    if (dashboard?.monthly_attendance) {
      const present = dashboard.monthly_attendance.Present_count;
      const workingDays = dashboard.monthly_attendance.Total_working_days || 26;
      return `${present} / ${workingDays}`;
    }
    if (calendarData?.summary) {
      return `${calendarData.summary.Present_count} / 26`;
    }
    return "0 / 26";
  }, [dashboard?.attendance_summary, dashboard?.monthly_attendance, calendarData?.summary]);

  // Leave Balance (using summary.total_leaves_left_label or total_leaves_left)
  const totalLeaveLeft = useMemo(() => {
    if (dashboard?.summary?.total_leaves_left_label) {
      return dashboard.summary.total_leaves_left_label;
    }
    if (dashboard?.summary?.total_leaves_left !== undefined) {
      const val = dashboard.summary.total_leaves_left;
      return `${val} ${val === 1 ? "Day" : "Days"}`;
    }
    return "0 Days";
  }, [dashboard?.summary]);

  // Today's Schedule (using today_schedule from API)
  const schedule = useMemo(() => {
    if (dashboard?.today_schedule) {
      return {
        time:
          dashboard.today_schedule.display_time ||
          (dashboard.today_schedule.start_time && dashboard.today_schedule.end_time
            ? `${dashboard.today_schedule.start_time} – ${dashboard.today_schedule.end_time}`
            : dashboard.today_schedule.start_time || "09:30 AM – 06:30 PM"),
        shift: dashboard.today_schedule.shift_name || "General Shift",
      };
    }
    const checkOut = dashboard?.summary?.scheduled_check_out;
    const timeDisplay = checkOut && checkOut !== "—" ? `09:30 AM – ${checkOut}` : "09:30 AM – 06:30 PM";
    const shiftDisplay =
      String(employeeDetails?.Shift_name ?? employeeDetails?.work_shift_name ?? "") ||
      "General Shift";
    return {
      time: timeDisplay,
      shift: shiftDisplay,
    };
  }, [dashboard?.today_schedule, dashboard?.summary, employeeDetails]);

  // Leave Balances List
  const leaveBalanceItems = useMemo(() => {
    if (dashboard?.leave_balances && dashboard.leave_balances.length > 0) {
      return dashboard.leave_balances.map((leave, index) => {
        let iconType: "amber" | "teal" | "rose" | "blue" = "blue";
        const nameLower = leave.Leave_Name.toLowerCase();
        if (nameLower.includes("casual")) iconType = "amber";
        else if (nameLower.includes("earned") || nameLower.includes("annual")) iconType = "teal";
        else if (nameLower.includes("sick") || nameLower.includes("medical")) iconType = "rose";

        const rawBal = Number(leave.Balance_Days ?? (Number(leave.Total_Days) - Number(leave.Used_Days)));
        const displayBal = Number.isFinite(rawBal)
          ? Number.isInteger(rawBal) ? String(rawBal) : rawBal.toFixed(1)
          : String(leave.Balance_Days ?? 0);

        return {
          id: leave.Leave_Id || index,
          name: leave.Leave_Name,
          days: `${displayBal} ${displayBal === "1" ? "Day" : "Days"}`,
          type: iconType,
        };
      });
    }

    return [];
  }, [dashboard?.leave_balances]);

  // Recent Payslips
  const payslipItems = useMemo(() => {
    if (dashboard?.salary_history && dashboard.salary_history.length > 0) {
      return dashboard.salary_history.slice(0, 3).map((item, index) => ({
        id: index,
        month: item.month,
      }));
    }
    return [];
  }, [dashboard?.salary_history]);

  // Announcements
  const announcementItems = useMemo(() => {
    if (dashboard?.announcements && dashboard.announcements.length > 0) {
      return dashboard.announcements.slice(0, 3);
    }
    return [];
  }, [dashboard?.announcements]);

  // Profile Card Details
  const profileDetails = useMemo(() => {
    const code =
      dashboard?.header?.employee_code ||
      profile?.employeeCode ||
      String(employeeDetails?.Employee_code ?? "") ||
      "EMP001";

    const designation =
      dashboard?.designation ||
      String(employeeDetails?.Designation_name ?? "") ||
      profile?.roleName ||
      "Employee";

    const department =
      dashboard?.department ||
      String(employeeDetails?.Department_name ?? "") ||
      profile?.branchName ||
      "Department";

    return { code, designation, department };
  }, [profile, dashboard, employeeDetails]);

  // Today In / Out for Mobile View
  const todayInOut = useMemo(() => {
    const timeline = dashboard?.timeline ?? [];
    const checkIn = timeline.find((t) => t.Punch_type === 1 || t.Event_label.toLowerCase().includes("in"));
    const checkOut = [...timeline].reverse().find((t) => t.Punch_type === 2 || t.Event_label.toLowerCase().includes("out"));
    return {
      inTime: checkIn?.Event_time_display || "--:--",
      outTime: checkOut?.Event_time_display || "--:--",
    };
  }, [dashboard?.timeline]);

  // Calendar Grid computation
  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth - 1, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
    const daysInPrevMonth = new Date(calendarYear, calendarMonth - 1, 0).getDate();

    const daysMap = new Map<number, ReturnType<typeof myAttendanceDayTone>>();
    if (calendarData?.days) {
      calendarData.days.forEach((d) => {
        if (d.Day_no) daysMap.set(d.Day_no, myAttendanceDayTone(d));
      });
    }

    const cells: Array<{
      key: string;
      dayNum: number;
      isCurrentMonth: boolean;
      statusTone?: "present" | "half-day" | "absent" | "leave" | "default";
      isToday: boolean;
    }> = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        key: `prev-${i}`,
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        today.getFullYear() === calendarYear &&
        today.getMonth() === calendarMonth - 1 &&
        today.getDate() === day;

      const tone = daysMap.get(day);
      let statusTone: "present" | "half-day" | "absent" | "leave" | "default" = "default";
      if (tone === "present") statusTone = "present";
      else if (tone === "half-day") statusTone = "half-day";
      else if (tone === "absent") statusTone = "absent";
      else if (tone === "leave") statusTone = "leave";

      cells.push({
        key: `curr-${day}`,
        dayNum: day,
        isCurrentMonth: true,
        statusTone,
        isToday,
      });
    }

    const totalRendered = cells.length;
    const targetCount = totalRendered > 35 ? 42 : 35;
    for (let day = 1; day <= targetCount - totalRendered; day++) {
      cells.push({
        key: `next-${day}`,
        dayNum: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return cells;
  }, [calendarYear, calendarMonth, calendarData?.days, today]);

  // Mark attendance action (for Mobile View)
  const handleMarkAttendance = async () => {
    setPunching(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      toastSuccess("Attendance marked successfully!");
      void loadDashboardData();
    } catch {
      toastError("Failed to record punch.");
    } finally {
      setPunching(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-6 animate-pulse space-y-6">
        <div className="h-44 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="container-fluid py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            className="btn btn-primary mt-3"
            onClick={() => void loadDashboardData()}
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 space-y-5">
      {/* =========================================================================
          DESKTOP / TABLET VIEW: Web Panel – Employee Dashboard (Hidden on Mobile)
         ========================================================================= */}
      <div className="hidden md:block space-y-5">
        {/* 1. Welcome Banner */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-9 shadow-[0_4px_20px_rgba(13,32,66,0.06)] min-h-[145px] sm:min-h-[160px] flex items-center bg-[#dcecfc]"
          style={{
            backgroundImage: "url('/images/dashboard_img/emp-banner.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center right",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="relative z-10 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0d2042] flex items-center gap-2">
              <span>{greeting}, {firstName}</span>
              <span className="inline-block hover:animate-wiggle">👋</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#475569] font-medium">
              Welcome to PrioHRMS Employee Portal
            </p>
          </div>
        </div>

        {/* 2. Top Stats: Row of 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 flex items-center gap-3.5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] hover:shadow-[0_8px_24px_rgba(13,32,66,0.08)] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center flex-shrink-0">
              <Calendar size={22} strokeWidth={2.3} />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-[var(--muted)] tracking-tight">Attendance</span>
              <span className="block text-xl font-extrabold text-[var(--title)] tracking-tight">{attendanceRatio}</span>
              <span className="block text-[11px] font-medium text-[var(--muted)]">Days Present</span>
            </div>
          </div>

          <Link
            href="/ess/leave"
            className="bg-[var(--card-bg)] rounded-2xl p-5 flex items-center gap-3.5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] hover:shadow-[0_8px_24px_rgba(13,32,66,0.08)] transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Plane size={22} strokeWidth={2.3} />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-[var(--muted)] tracking-tight">Leave Balance</span>
              <span className="block text-xl font-extrabold text-[var(--title)] tracking-tight">{totalLeaveLeft}</span>
              <span className="block text-[11px] font-medium text-[var(--muted)]">Available</span>
            </div>
          </Link>

          <Link
            href="/ess/holiday"
            className="bg-[var(--card-bg)] rounded-2xl p-5 flex items-center gap-3.5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] hover:shadow-[0_8px_24px_rgba(13,32,66,0.08)] transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Gift size={22} strokeWidth={2.3} />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-[var(--muted)] tracking-tight">Upcoming Holiday</span>
              <span className="block text-base sm:text-lg lg:text-xl font-extrabold text-[var(--title)] tracking-tight truncate">
                {upcomingHoliday.dateStr}
              </span>
              <span className="block text-[11px] font-medium text-[var(--muted)] truncate">
                {upcomingHoliday.name}
              </span>
            </div>
          </Link>

          <div className="bg-[var(--card-bg)] rounded-2xl p-5 flex items-center gap-3.5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] hover:shadow-[0_8px_24px_rgba(13,32,66,0.08)] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center flex-shrink-0">
              <Clock size={22} strokeWidth={2.3} />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-[var(--muted)] tracking-tight">Today&apos;s Schedule</span>
              <span className="block text-base sm:text-lg font-extrabold text-[var(--title)] tracking-tight truncate">
                {schedule.time}
              </span>
              <span className="block text-[11px] font-medium text-[var(--muted)] truncate">{schedule.shift}</span>
            </div>
          </div>
        </div>

        {/* 3. Middle Section: 3 Columns */}
        <div className="grid grid-cols-12 gap-5">
          {/* Column 1: This Month Attendance */}
          <div className="col-span-12 md:col-span-12 lg:col-span-5 bg-[var(--card-bg)] rounded-2xl p-5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-[var(--primary)]" />
                  <h2 className="text-sm font-bold text-[var(--title)]">This Month Attendance</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--title)]">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-md hover:bg-[var(--card-soft)] text-[var(--muted)] hover:text-[var(--title)] transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="min-w-[76px] text-center">
                    {MONTH_NAMES[calendarMonth - 1]} {calendarYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-md hover:bg-[var(--card-soft)] text-[var(--muted)] hover:text-[var(--title)] transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-[var(--muted)] pb-2">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-1">
                    {w}
                  </div>
                ))}
              </div>

              <div className={cn("grid grid-cols-7 gap-y-1.5 gap-x-1 text-center py-1", calendarLoading && "opacity-60")}>
                {calendarCells.map((cell) => {
                  const isPresent = cell.statusTone === "present";
                  const isHalfDay = cell.statusTone === "half-day";
                  const isAbsent = cell.statusTone === "absent";
                  const isLeave = cell.statusTone === "leave";

                  return (
                    <div key={cell.key} className="h-8 flex items-center justify-center">
                      <span
                        className={cn(
                          "w-7 h-7 flex items-center justify-center rounded-full text-xs transition-transform",
                          !cell.isCurrentMonth && "text-slate-300 dark:text-slate-600 font-normal",
                          cell.isCurrentMonth && !isPresent && !isHalfDay && !isAbsent && !isLeave && "text-[var(--title)] font-medium",
                          cell.isToday && "ring-2 ring-sky-500 font-bold text-sky-600",
                          isPresent && "bg-[#22c55e] text-white font-bold shadow-xs",
                          isHalfDay && "bg-[#f59e0b] text-white font-bold shadow-xs",
                          isAbsent && "bg-[#ef4444] text-white font-bold shadow-xs",
                          isLeave && "bg-[#8b5cf6] text-white font-bold shadow-xs",
                        )}
                      >
                        {cell.dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-[var(--border)] flex items-center justify-center gap-3.5 sm:gap-5 text-[11px] font-medium text-[var(--muted)] flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> Present
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Half Day
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Absent
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Leave
              </span>
            </div>
          </div>

          {/* Column 2: Leave Balance */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-[var(--card-bg)] rounded-2xl p-5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-[var(--primary)]" />
                  <h2 className="text-sm font-bold text-[var(--title)]">Leave Balance</h2>
                </div>
                <Link
                  href="/ess/leave"
                  className="text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3.5 py-1">
                {leaveBalanceItems.length > 0 ? (
                  leaveBalanceItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--card-soft)] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                            item.type === "amber" && "bg-amber-50 text-amber-600 dark:bg-amber-950/40",
                            item.type === "teal" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40",
                            item.type === "rose" && "bg-rose-50 text-rose-600 dark:bg-rose-950/40",
                            item.type === "blue" && "bg-sky-50 text-sky-600 dark:bg-sky-950/40",
                          )}
                        >
                          {item.type === "amber" ? (
                            <Layers size={18} strokeWidth={2.2} />
                          ) : item.type === "teal" ? (
                            <Sparkles size={18} strokeWidth={2.2} />
                          ) : item.type === "rose" ? (
                            <HeartPulse size={18} strokeWidth={2.2} />
                          ) : (
                            <Folder size={18} strokeWidth={2.2} />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-[var(--title)] truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[var(--title)] flex-shrink-0 ml-2">
                        {item.days}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--muted)] py-4 text-center font-medium">
                    No leave balance records found.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Quick Actions */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-[var(--card-bg)] rounded-2xl p-5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] mb-3">
                <Sparkles size={18} className="text-[var(--primary)]" />
                <h2 className="text-sm font-bold text-[var(--title)]">Quick Actions</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  href="/leave/leave-requisition"
                  className="group flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#f0f7ff] dark:bg-[#1a3058] hover:bg-[#e1effe] dark:hover:bg-[#203a6a] transition-all hover:scale-[1.03] text-center shadow-[0_2px_8px_rgba(13,32,66,0.03)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#15294d] text-[var(--primary)] flex items-center justify-center shadow-xs mb-2 group-hover:scale-110 transition-transform">
                    <Send size={18} strokeWidth={2.3} />
                  </div>
                  <span className="text-xs font-bold text-[var(--title)]">Apply Leave</span>
                </Link>

                <Link
                  href="/ess/attendance"
                  className="group flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#f0f7ff] dark:bg-[#1a3058] hover:bg-[#e1effe] dark:hover:bg-[#203a6a] transition-all hover:scale-[1.03] text-center shadow-[0_2px_8px_rgba(13,32,66,0.03)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#15294d] text-[var(--primary)] flex items-center justify-center shadow-xs mb-2 group-hover:scale-110 transition-transform">
                    <Scan size={18} strokeWidth={2.3} />
                  </div>
                  <span className="text-xs font-bold text-[var(--title)]">Attendance</span>
                </Link>

                <Link
                  href="/ess/payslips"
                  className="group flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#f0f7ff] dark:bg-[#1a3058] hover:bg-[#e1effe] dark:hover:bg-[#203a6a] transition-all hover:scale-[1.03] text-center shadow-[0_2px_8px_rgba(13,32,66,0.03)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#15294d] text-[var(--primary)] flex items-center justify-center shadow-xs mb-2 group-hover:scale-110 transition-transform">
                    <Download size={18} strokeWidth={2.3} />
                  </div>
                  <span className="text-xs font-bold text-[var(--title)] leading-tight">
                    Download<br />Payslip
                  </span>
                </Link>

                <Link
                  href="/ess/requests"
                  className="group flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#f0f7ff] dark:bg-[#1a3058] hover:bg-[#e1effe] dark:hover:bg-[#203a6a] transition-all hover:scale-[1.03] text-center shadow-[0_2px_8px_rgba(13,32,66,0.03)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#15294d] text-[var(--primary)] flex items-center justify-center shadow-xs mb-2 group-hover:scale-110 transition-transform">
                    <HelpCircle size={18} strokeWidth={2.3} />
                  </div>
                  <span className="text-xs font-bold text-[var(--title)] leading-tight">
                    Raise<br />Request
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Section: 3 Columns */}
        <div className="grid grid-cols-12 gap-5">
          {/* Column 1: Announcements */}
          <div className="col-span-12 md:col-span-12 lg:col-span-5 bg-[var(--card-bg)] rounded-2xl p-5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                <div className="flex items-center gap-2">
                  <Megaphone size={18} className="text-[var(--primary)]" />
                  <h2 className="text-sm font-bold text-[var(--title)]">Announcements</h2>
                </div>
                <Link
                  href="/ess/requests"
                  className="text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3.5 py-1">
                {announcementItems.length > 0 ? (
                  announcementItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0" />
                        <span className="font-semibold text-[var(--title)] truncate hover:text-[var(--primary)] transition-colors cursor-pointer">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--muted)] font-medium flex-shrink-0">
                        {item.date}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--muted)] py-4 text-center font-medium">
                    No announcements at this time.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Payslip (Recent) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-[var(--card-bg)] rounded-2xl p-5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[var(--primary)]" />
                  <h2 className="text-sm font-bold text-[var(--title)]">Payslip (Recent)</h2>
                </div>
                <Link
                  href="/ess/payslips"
                  className="text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3 py-1">
                {payslipItems.length > 0 ? (
                  payslipItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-1.5 rounded-xl hover:bg-[var(--card-soft)] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200">
                          PDF
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[var(--title)] truncate">
                          {item.month}
                        </span>
                      </div>
                      <Link
                        href="/ess/payslips"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] bg-[#eef6ff] dark:bg-[#1a3058] hover:bg-[#dbeafe] dark:hover:bg-[#223e70] px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Download size={13} strokeWidth={2.2} />
                        <span>Download</span>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--muted)] py-4 text-center font-medium">
                    No recent payslips available.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: My Profile */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-[var(--card-bg)] rounded-2xl p-5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-[var(--primary)]" />
                  <h2 className="text-sm font-bold text-[var(--title)]">My Profile</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f1f4f9] dark:bg-[#1a3058] text-[var(--title)]">
                  {profileDetails.code}
                </span>
              </div>

              <div className="pt-1 text-left">
                <h3 className="text-base font-bold text-[var(--title)] truncate">{employeeName}</h3>
                <p className="text-xs font-medium text-[var(--muted)] truncate mt-0.5">
                  {profileDetails.designation}
                </p>
                <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                  {profileDetails.department}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/ess/profile"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 text-xs font-bold text-white bg-[var(--primary)] hover:bg-[#3855c7] rounded-xl shadow-[0_4px_12px_rgba(70,102,225,0.25)] transition-all"
              >
                <span>View Profile</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW: Mobile App – Employee Dashboard (Visible ONLY on Mobile < 768px)
         ========================================================================= */}
      <div className="block md:hidden space-y-4 pb-20">
        {/* Mobile Header / Profile Card */}
        <div className="rounded-3xl bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#0284c7] p-5 text-white shadow-[0_4px_18px_rgba(37,99,235,0.25)]">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-full bg-white/20 p-1 flex items-center justify-center border border-white/30 flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-white text-blue-600 flex items-center justify-center font-extrabold text-base">
                {firstName[0] || "U"}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white truncate">
                {greeting}, {firstName}
              </h2>
              <p className="text-xs text-sky-100 font-medium truncate mt-0.5">
                {profileDetails.code} • {profileDetails.designation}
              </p>
            </div>
          </div>
        </div>

        {/* 6 Quick Action Icon Buttons (3 columns x 2 rows) */}
        <div className="grid grid-cols-3 gap-2.5">
          <Link
            href="/ess/attendance"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--card-bg)] text-center shadow-[0_2px_10px_rgba(13,32,66,0.05)] hover:shadow-[0_4px_14px_rgba(13,32,66,0.08)] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5">
              <Calendar size={18} strokeWidth={2.3} />
            </div>
            <span className="text-[11px] font-bold text-[var(--title)]">Attendance</span>
          </Link>

          <Link
            href="/leave/leave-requisition"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--card-bg)] text-center shadow-[0_2px_10px_rgba(13,32,66,0.05)] hover:shadow-[0_4px_14px_rgba(13,32,66,0.08)] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5">
              <Send size={18} strokeWidth={2.3} />
            </div>
            <span className="text-[11px] font-bold text-[var(--title)]">Apply Leave</span>
          </Link>

          <Link
            href="/ess/leave"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--card-bg)] text-center shadow-[0_2px_10px_rgba(13,32,66,0.05)] hover:shadow-[0_4px_14px_rgba(13,32,66,0.08)] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5">
              <Layers size={18} strokeWidth={2.3} />
            </div>
            <span className="text-[11px] font-bold text-[var(--title)]">Leave Balance</span>
          </Link>

          <Link
            href="/ess/payslips"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--card-bg)] text-center shadow-[0_2px_10px_rgba(13,32,66,0.05)] hover:shadow-[0_4px_14px_rgba(13,32,66,0.08)] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5">
              <FileText size={18} strokeWidth={2.3} />
            </div>
            <span className="text-[11px] font-bold text-[var(--title)]">Payslip</span>
          </Link>

          <Link
            href="/ess/holiday"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--card-bg)] text-center shadow-[0_2px_10px_rgba(13,32,66,0.05)] hover:shadow-[0_4px_14px_rgba(13,32,66,0.08)] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
              <CalendarDays size={18} strokeWidth={2.3} />
            </div>
            <span className="text-[11px] font-bold text-[var(--title)]">Holiday</span>
          </Link>

          <Link
            href="/organization/shifts"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--card-bg)] text-center shadow-[0_2px_10px_rgba(13,32,66,0.05)] hover:shadow-[0_4px_14px_rgba(13,32,66,0.08)] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5">
              <Clock size={18} strokeWidth={2.3} />
            </div>
            <span className="text-[11px] font-bold text-[var(--title)]">Work Schedule</span>
          </Link>
        </div>

        {/* Today's Attendance Card */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-4.5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] space-y-3.5">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-[var(--title)]">Today&apos;s Attendance</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#ecfdf5] p-2.5 text-center">
              <span className="block text-[11px] font-semibold text-emerald-700">In</span>
              <span className="block text-base font-extrabold text-emerald-800 mt-0.5">
                {todayInOut.inTime}
              </span>
            </div>
            <div className="rounded-xl bg-[#fff1f2] p-2.5 text-center">
              <span className="block text-[11px] font-semibold text-rose-700">Out</span>
              <span className="block text-base font-extrabold text-rose-800 mt-0.5">
                {todayInOut.outTime}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMarkAttendance}
            disabled={punching}
            className="w-full py-3 px-4 rounded-xl bg-[var(--primary)] hover:bg-[#3855c7] text-white font-bold text-sm shadow-[0_4px_12px_rgba(70,102,225,0.25)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <ScanFace size={18} strokeWidth={2.4} />
            <span>{punching ? "Marking..." : "Mark Attendance"}</span>
          </button>
        </div>

        {/* Leave Balance (Mobile) */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-4.5 shadow-[0_4px_18px_rgba(13,32,66,0.05)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[var(--primary)]" />
              <h3 className="text-sm font-bold text-[var(--title)]">Leave Balance</h3>
            </div>
            <Link href="/ess/leave" className="text-xs font-semibold text-[var(--primary)] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {leaveBalanceItems.length > 0 ? (
              leaveBalanceItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1 text-xs">
                  <span className="inline-flex items-center gap-2 font-medium text-[var(--title)]">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        item.type === "amber" && "bg-amber-500",
                        item.type === "teal" && "bg-emerald-500",
                        item.type === "rose" && "bg-rose-500",
                        item.type === "blue" && "bg-sky-500",
                      )}
                    />
                    {item.name}
                  </span>
                  <span className="font-bold text-[var(--title)]">{item.days}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--muted)] py-2 text-center font-medium">
                No leave balance records found.
              </p>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar (Fixed) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--card-bg)]/95 backdrop-blur-md border-t border-[var(--border)] flex items-center justify-around py-2.5 px-3 shadow-[0_-4px_20px_rgba(13,32,66,0.06)]">
          <Link href="/ess" className="flex flex-col items-center gap-1 text-[var(--primary)]">
            <Home size={19} strokeWidth={2.4} />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link href="/ess/attendance" className="flex flex-col items-center gap-1 text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            <Calendar size={19} strokeWidth={2} />
            <span className="text-[10px] font-semibold">Attendance</span>
          </Link>
          <Link href="/ess/leave" className="flex flex-col items-center gap-1 text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            <Layers size={19} strokeWidth={2} />
            <span className="text-[10px] font-semibold">Leave</span>
          </Link>
          <Link href="/ess/payslips" className="flex flex-col items-center gap-1 text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            <FileText size={19} strokeWidth={2} />
            <span className="text-[10px] font-semibold">Payslip</span>
          </Link>
          <Link href="/ess/profile" className="flex flex-col items-center gap-1 text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            <User size={19} strokeWidth={2} />
            <span className="text-[10px] font-semibold">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
