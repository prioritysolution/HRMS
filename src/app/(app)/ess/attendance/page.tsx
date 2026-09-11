"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { RoundLoader } from "@/components/ui/RoundLoader";
import {
  MonthCalendar,
  type MonthCalendarDayItem,
  type MonthCalendarLegendItem,
} from "@/components/ui/MonthCalendar";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError } from "@/lib/api/client";
import { authService } from "@/lib/api/services/auth.service";
import {
  myAttendanceDayLabel,
  myAttendanceDayTone,
  myAttendanceService,
} from "@/lib/api/services/my-attendance.service";
import { isSameDay } from "@/lib/date-utils";
import type { MyAttendanceCalendar } from "@/lib/api/types";

const ATTENDANCE_LEGEND: MonthCalendarLegendItem[] = [
  { tone: "present", label: "Present" },
  { tone: "absent", label: "Absent" },
  { tone: "leave", label: "Leave" },
  { tone: "holiday", label: "Holiday" },
  { tone: "late", label: "Late" },
  { tone: "half-day", label: "Half Day" },
  { tone: "weekly-off", label: "Weekly Off" },
];

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
  const toast = useToast();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [calendar, setCalendar] = useState<MyAttendanceCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

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
            : "Failed to load attendance calendar.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [employeeId, month, toast, year]);

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
        day.Day_status_name || day.Attendance_status_name || (tone !== "default" ? tone.replace("-", " ") : "");
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
        statusName ? { label: "Status", value: statusName } : null,
        day.Holiday_name
          ? {
              label: "Holiday",
              value: day.Holiday_type_name
                ? `${day.Holiday_name} (${day.Holiday_type_name})`
                : day.Holiday_name,
            }
          : null,
        day.Leave_Name ? { label: "Leave", value: day.Leave_Name } : null,
        day.Half_Day != null
          ? { label: "Half Day", value: day.Half_Day === 2 ? "Second Half" : "First Half" }
          : null,
        checkIn ? { label: "Check-in", value: checkIn } : null,
        checkOut ? { label: "Check-out", value: checkOut } : null,
        worked ? { label: "Working", value: worked } : null,
        overtime ? { label: "Overtime", value: overtime } : null,
        day.Late_minutes && day.Late_minutes > 0
          ? { label: "Late", value: `${day.Late_minutes} min` }
          : null,
        day.Early_leave_minutes && day.Early_leave_minutes > 0
          ? { label: "Early leave", value: `${day.Early_leave_minutes} min` }
          : null,
        day.Source ? { label: "Source", value: day.Source } : null,
        day.Remarks ? { label: "Remarks", value: day.Remarks } : null,
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
  }, [calendar?.days, today]);

  const summary = calendar?.summary;

  return (
    <>
      <PageHeader title="My Attendance" section="Employee Self Service" />
      <div className="container-fluid">
        <div className="ess-stat-grid ess-stat-grid--attendance mb-4">
          <StatCard
            title="Present"
            value={String(summary?.Present_count ?? 0)}
            change=""
            hint={calendar?.month_name || "This month"}
            description="Present days"
            tone="success"
            icon="calendar"
            positive
          />
          <StatCard
            title="Absent"
            value={String(summary?.Absent_count ?? 0)}
            change=""
            hint={calendar?.month_name || "This month"}
            description="Absent days"
            tone="danger"
            icon="users"
            positive={false}
          />
          <StatCard
            title="Leave"
            value={String(summary?.Leave_count ?? 0)}
            change=""
            hint={calendar?.month_name || "This month"}
            description="Leave days"
            tone="info"
            icon="calendar"
            positive
          />
          <StatCard
            title="Holiday"
            value={String(summary?.Holiday_count ?? 0)}
            change=""
            hint={calendar?.month_name || "This month"}
            description="Holidays"
            tone="orange"
            icon="calendar"
            positive
          />
          <StatCard
            title="Late"
            value={String(summary?.Late_count ?? 0)}
            change=""
            hint={calendar?.month_name || "This month"}
            description="Late days"
            tone="warning"
            icon="clock"
            positive={false}
          />
          <StatCard
            title="Weekly Off"
            value={String(summary?.Weekly_off_count ?? 0)}
            change=""
            hint={calendar?.month_name || "This month"}
            description="Weekly offs"
            tone="primary"
            icon="calendar"
            positive
          />
        </div>

        {loading && !calendar ? (
          <div className="card">
            <div className="card-body employee-profile-loading">
              <RoundLoader />
              <p>Loading attendance calendar…</p>
            </div>
          </div>
        ) : (
          <MonthCalendar
            year={year}
            month={month}
            days={calendarDays}
            title={
              calendar?.display_name
                ? `Attendance — ${calendar.display_name}`
                : "Attendance Calendar"
            }
            loading={loading}
            onPrevMonth={goPrev}
            onNextMonth={goNext}
            legend={ATTENDANCE_LEGEND}
          />
        )}
      </div>
    </>
  );
}
