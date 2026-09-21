"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDetailsSidebar,
  attendanceToneClass,
  type CalendarSidebarItem,
} from "@/components/ui/CalendarDetailsSidebar";
import { CalendarSplitLayout } from "@/components/ui/CalendarSplitLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { RoundLoader } from "@/components/ui/RoundLoader";
import {
  MonthCalendar,
  MONTH_CALENDAR_MONTHS,
  type MonthCalendarDayItem,
  type MonthCalendarLegendItem,
} from "@/components/ui/MonthCalendar";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api/client";
import { authService } from "@/lib/api/services/auth.service";
import {
  myAttendanceDayLabel,
  myAttendanceDayTone,
  myAttendanceService,
} from "@/lib/api/services/my-attendance.service";
import { isSameDay } from "@/lib/date-utils";
import type { MyAttendanceCalendar } from "@/lib/api/types";

function formatMinutes(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const mins = Number(value);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function EssAttendancePage() {
  const { t } = useI18n();
  const toast = useToast();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [calendar, setCalendar] = useState<MyAttendanceCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const legend = useMemo(
    (): MonthCalendarLegendItem[] => [
      { tone: "present", label: t("ess.present") },
      { tone: "absent", label: t("ess.absent") },
      { tone: "leave", label: t("ess.leave") },
      { tone: "holiday", label: t("ess.holiday") },
      { tone: "late", label: t("ess.attendancePage.late") },
      { tone: "half-day", label: t("ess.attendancePage.halfDay") },
      { tone: "weekly-off", label: t("ess.attendancePage.weeklyOff") },
    ],
    [t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let empId = employeeId;
      if (empId == null) {
        const me = await authService.getMeProfile();
        empId = me?.employeeId ?? null;
        setEmployeeId(empId);
      }

      const data = await myAttendanceService.calendar({
        year,
        month,
        ...(empId ? { employee_id: empId } : {}),
      });
      setCalendar(data);
    } catch (err) {
      setCalendar(null);
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t("ess.attendancePage.loadError");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [employeeId, month, t, toast, year]);

  useEffect(() => {
    void load();
  }, [load]);

  const goPrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
      return;
    }
    setMonth((m) => m - 1);
  };

  const goNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
      return;
    }
    setMonth((m) => m + 1);
  };

  const calendarDays: MonthCalendarDayItem[] = useMemo(() => {
    if (!calendar?.days?.length) return [];
    return calendar.days.map((day) => {
      const date = day.Attendance_date;
      const dateObj = date ? new Date(`${date}T00:00:00`) : null;
      const tone = myAttendanceDayTone(day);
      const label = myAttendanceDayLabel(day);
      const statusName =
        day.Day_status_name ||
        day.Attendance_status_name ||
        (tone !== "default" ? tone.replace("-", " ") : "");
      const checkIn = day.Check_in;
      const checkOut = day.Check_out;
      const worked = formatMinutes(day.Working_minutes);
      const overtime = formatMinutes(day.Overtime_minutes);
      const chipSubtitle = [
        checkIn && checkOut ? `${checkIn} – ${checkOut}` : checkIn || checkOut || null,
      ]
        .filter(Boolean)
        .join(" · ");

      const details = [
        statusName ? { label: t("ess.attendancePage.status"), value: statusName } : null,
        day.Holiday_name
          ? {
              label: t("ess.holiday"),
              value: day.Holiday_type_name
                ? `${day.Holiday_name} (${day.Holiday_type_name})`
                : day.Holiday_name,
            }
          : null,
        day.Leave_Name ? { label: t("ess.leave"), value: day.Leave_Name } : null,
        day.Half_Day != null
          ? {
              label: t("ess.attendancePage.halfDay"),
              value:
                day.Half_Day === 2
                  ? t("ess.attendancePage.secondHalf")
                  : t("ess.attendancePage.firstHalf"),
            }
          : null,
        checkIn ? { label: t("ess.attendancePage.checkIn"), value: checkIn } : null,
        checkOut ? { label: t("ess.attendancePage.checkOut"), value: checkOut } : null,
        worked ? { label: t("ess.attendancePage.working"), value: worked } : null,
        overtime ? { label: t("ess.attendancePage.overtime"), value: overtime } : null,
        day.Late_minutes && day.Late_minutes > 0
          ? {
              label: t("ess.attendancePage.late"),
              value: t("ess.attendancePage.minutes", { count: day.Late_minutes }),
            }
          : null,
        day.Early_leave_minutes && day.Early_leave_minutes > 0
          ? {
              label: t("ess.attendancePage.earlyLeave"),
              value: t("ess.attendancePage.minutes", { count: day.Early_leave_minutes }),
            }
          : null,
        day.Source ? { label: t("ess.attendancePage.source"), value: day.Source } : null,
        day.Remarks ? { label: t("ess.attendancePage.remarks"), value: day.Remarks } : null,
      ].filter((row): row is { label: string; value: string } => row !== null);

      return {
        day: day.Day_no,
        date,
        tone,
        label: label || statusName || undefined,
        subtitle: chipSubtitle || undefined,
        detailTitle: label || statusName || undefined,
        detailBadge: statusName || (tone !== "default" ? tone.replace("-", " ") : undefined),
        detailDescription: day.Holiday_name
          ? day.Holiday_type_name
            ? `${day.Holiday_name} · ${day.Holiday_type_name}`
            : day.Holiday_name
          : day.Leave_Name || undefined,
        details,
        isToday: dateObj ? isSameDay(dateObj, today) : false,
      };
    });
  }, [calendar?.days, t, today]);

  const sidebarItems: CalendarSidebarItem[] = useMemo(() => {
    const normalizedToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const notable = (calendar?.days ?? []).filter((day) => {
      const tone = myAttendanceDayTone(day);
      return tone !== "default" && tone !== "present";
    });

    const nextDate =
      notable.find((day) => {
        if (!day.Attendance_date) return false;
        const d = new Date(`${day.Attendance_date}T00:00:00`);
        return d >= normalizedToday;
      })?.Attendance_date ?? null;

    return notable.map((day) => {
      const tone = myAttendanceDayTone(day);
      const label = myAttendanceDayLabel(day);
      const statusName =
        day.Day_status_name ||
        day.Attendance_status_name ||
        label ||
        tone.replace("-", " ");
      const title =
        day.Holiday_name || day.Leave_Name || statusName || t("ess.attendancePage.dayDetail");
      const metaParts = [
        statusName && statusName !== title ? statusName : null,
        day.Check_in && day.Check_out
          ? `${day.Check_in} – ${day.Check_out}`
          : day.Check_in || day.Check_out || null,
      ].filter(Boolean);
      const date = day.Attendance_date || "";
      const d = date ? new Date(`${date}T00:00:00`) : null;
      const isPast = d ? d < normalizedToday : false;
      const isTodayRow = Boolean(
        day.Attendance_date && isSameDay(new Date(`${day.Attendance_date}T00:00:00`), today),
      );

      return {
        id: date || String(day.Day_no),
        date,
        title,
        meta: metaParts.join(" · ") || undefined,
        metaToneClass: attendanceToneClass(tone),
        muted: isPast,
        isNext: Boolean(nextDate && date === nextDate && !isPast),
        badge: isTodayRow ? t("ess.attendancePage.today") : undefined,
      };
    });
  }, [calendar?.days, t, today]);

  const summary = calendar?.summary;
  const monthHint = calendar?.month_name || t("ess.thisMonth");
  const monthLabel =
    calendar?.month_name || `${MONTH_CALENDAR_MONTHS[Math.max(0, month - 1)]} ${year}`;

  return (
    <>
      <PageHeader title={t("ess.attendancePage.title")} section={t("ess.section")} />
      <div className="container-fluid">
        <div className="ess-stat-grid ess-stat-grid--attendance mb-4">
          <StatCard
            title={t("ess.present")}
            value={String(summary?.Present_count ?? 0)}
            change=""
            hint={monthHint}
            description={t("ess.attendancePage.presentDays")}
            tone="success"
            icon="calendar"
            positive
          />
          <StatCard
            title={t("ess.absent")}
            value={String(summary?.Absent_count ?? 0)}
            change=""
            hint={monthHint}
            description={t("ess.attendancePage.absentDays")}
            tone="danger"
            icon="users"
            positive={false}
          />
          <StatCard
            title={t("ess.leave")}
            value={String(summary?.Leave_count ?? 0)}
            change=""
            hint={monthHint}
            description={t("ess.attendancePage.leaveDays")}
            tone="info"
            icon="calendar"
            positive
          />
          <StatCard
            title={t("ess.holiday")}
            value={String(summary?.Holiday_count ?? 0)}
            change=""
            hint={monthHint}
            description={t("ess.attendancePage.holidays")}
            tone="orange"
            icon="calendar"
            positive
          />
          <StatCard
            title={t("ess.attendancePage.late")}
            value={String(summary?.Late_count ?? 0)}
            change=""
            hint={monthHint}
            description={t("ess.attendancePage.lateDays")}
            tone="warning"
            icon="clock"
            positive={false}
          />
          <StatCard
            title={t("ess.attendancePage.weeklyOff")}
            value={String(summary?.Weekly_off_count ?? 0)}
            change=""
            hint={monthHint}
            description={t("ess.attendancePage.weeklyOffs")}
            tone="primary"
            icon="calendar"
            positive
          />
        </div>

        <CalendarSplitLayout
          className="mb-4"
          syncKey={`${year}-${month}-${loading ? 1 : 0}-${calendarDays.length}`}
          calendar={
            loading && !calendar ? (
              <div className="card">
                <div className="card-body employee-profile-loading">
                  <RoundLoader />
                  <p>{t("ess.attendancePage.loading")}</p>
                </div>
              </div>
            ) : (
              <MonthCalendar
                year={year}
                month={month}
                days={calendarDays}
                title={
                  calendar?.display_name
                    ? t("ess.attendancePage.calendarNamed", { name: calendar.display_name })
                    : t("ess.attendancePage.calendarTitle")
                }
                loading={loading}
                onPrevMonth={goPrev}
                onNextMonth={goNext}
                onYearChange={setYear}
                onMonthChange={setMonth}
                legend={legend}
              />
            )
          }
          sidebar={
            <CalendarDetailsSidebar
              title={t("ess.attendancePage.dayDetails")}
              subtitle={t("ess.attendancePage.notableSubtitle", { month: monthLabel })}
              items={sidebarItems}
              loading={loading}
              emptyMessage={t("ess.attendancePage.emptyNotable")}
              className="w-full"
            />
          }
        />
      </div>
    </>
  );
}
