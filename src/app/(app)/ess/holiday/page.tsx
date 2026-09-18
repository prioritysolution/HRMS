"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDetailsSidebar,
  holidayTypeToneClass,
  type CalendarSidebarItem,
} from "@/components/ui/CalendarDetailsSidebar";
import { CalendarSplitLayout } from "@/components/ui/CalendarSplitLayout";
import {
  MonthCalendar,
  type MonthCalendarDayItem,
} from "@/components/ui/MonthCalendar";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/i18n";
import { ApiError, holidayService } from "@/lib/api";
import type { HolidayCalendarEntry, HolidayCalendarResponse } from "@/lib/api/types";
import { formatDateDisplay, isSameDay, parseDateToIso } from "@/lib/date-utils";

function parseIsoDate(dateStr: string): Date | null {
  const iso = parseDateToIso(dateStr) || dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export default function EssHolidaysPage() {
  const { t } = useI18n();
  const toast = useToast();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [data, setData] = useState<HolidayCalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await holidayService.calendar({
        year_sl: year,
        month_sl: month,
      });
      setData(result);
    } catch (error) {
      setData(null);
      toast.error({
        title: t("ess.holidayPage.loadErrorTitle"),
        message:
          error instanceof ApiError
            ? error.message
            : t("ess.holidayPage.loadErrorMessage"),
      });
    } finally {
      setLoading(false);
    }
  }, [month, t, toast, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial/async data load
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

  const upcoming = useMemo(() => {
    const list = [...(data?.upcoming ?? [])];
    list.sort((a, b) => {
      const left = parseIsoDate(a.Holiday_date)?.getTime() ?? 0;
      const right = parseIsoDate(b.Holiday_date)?.getTime() ?? 0;
      return left - right;
    });
    return list;
  }, [data?.upcoming]);

  const nextHolidayId = useMemo(() => {
    const marked = upcoming.find((item) => Number(item.Is_next) === 1);
    if (marked) return marked.Holiday_id;
    const normalizedToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const next = upcoming.find((item) => {
      const date = parseIsoDate(item.Holiday_date);
      return date ? date >= normalizedToday : false;
    });
    return next?.Holiday_id ?? null;
  }, [today, upcoming]);

  const sidebarItems: CalendarSidebarItem[] = useMemo(() => {
    const normalizedToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    return upcoming.map((holiday) => {
      const hDate = parseIsoDate(holiday.Holiday_date);
      const isUpcoming =
        Number(holiday.Is_upcoming) === 1 || (hDate ? hDate >= normalizedToday : false);
      const typeName = String(holiday.Holiday_type_name ?? "").trim();
      return {
        id: holiday.Holiday_id,
        date: holiday.Holiday_date,
        title: holiday.Holiday_name,
        meta: typeName || undefined,
        metaToneClass: typeName ? holidayTypeToneClass(typeName) : undefined,
        muted: !isUpcoming,
        isNext: holiday.Holiday_id === nextHolidayId,
      };
    });
  }, [nextHolidayId, today, upcoming]);

  const calendarDays: MonthCalendarDayItem[] = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDate = new Map<string, HolidayCalendarEntry[]>();

    for (const holiday of data?.calendar ?? []) {
      const iso = parseDateToIso(holiday.Holiday_date) || holiday.Holiday_date;
      if (!iso) continue;
      const bucket = byDate.get(iso) ?? [];
      bucket.push(holiday);
      byDate.set(iso, bucket);
    }

    const items: MonthCalendarDayItem[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateObj = new Date(year, month - 1, day);
      const holidaysOnDay = byDate.get(date) ?? [];
      const primary = holidaysOnDay[0];
      const typeName = String(primary?.Holiday_type_name ?? "").trim();
      const remarks = String(primary?.Remarks ?? "").trim();
      const extraCount = holidaysOnDay.length - 1;

      items.push({
        day,
        date,
        isToday: isSameDay(today, dateObj),
        tone: primary ? "holiday" : "default",
        label: primary?.Holiday_name,
        subtitle: typeName
          ? extraCount > 0
            ? `${typeName} · ${t("ess.holidayPage.moreCount", { count: extraCount })}`
            : typeName
          : extraCount > 0
            ? t("ess.holidayPage.moreCount", { count: extraCount })
            : undefined,
        detailTitle: primary?.Holiday_name,
        detailBadge: typeName || (primary ? t("ess.holiday") : undefined),
        detailDescription: remarks || undefined,
        details: primary
          ? [
              typeName ? { label: t("ess.holidayPage.type"), value: typeName } : null,
              {
                label: t("ess.holidayPage.date"),
                value: formatDateDisplay(date),
              },
              remarks ? { label: t("ess.holidayPage.remarks"), value: remarks } : null,
              extraCount > 0
                ? {
                    label: t("ess.holidayPage.alsoOnDay"),
                    value: t("ess.holidayPage.moreHolidays", { count: extraCount }),
                  }
                : null,
            ].filter((row): row is { label: string; value: string } => row !== null)
          : undefined,
      });
    }

    return items;
  }, [data?.calendar, month, t, today, year]);

  const scheduleYear = data?.year ?? year;

  return (
    <>
      <PageHeader title={t("ess.holidayPage.title")} section={t("ess.section")} />
      <div className="container-fluid py-6 animate-in fade-in duration-300">
        <CalendarSplitLayout
          syncKey={`${year}-${month}-${loading ? 1 : 0}`}
          calendar={
            loading && !data ? (
              <div className="card">
                <div className="card-body employee-profile-loading">
                  <RoundLoader />
                  <p>{t("ess.holidayPage.loading")}</p>
                </div>
              </div>
            ) : (
              <MonthCalendar
                year={year}
                month={month}
                days={calendarDays}
                title={t("ess.holidayPage.calendarView")}
                loading={loading}
                onPrevMonth={goPrev}
                onNextMonth={goNext}
                onYearChange={setYear}
                onMonthChange={setMonth}
                legend={[{ tone: "holiday", label: t("ess.holiday") }]}
              />
            )
          }
          sidebar={
            <CalendarDetailsSidebar
              title={t("ess.holidayPage.upcoming")}
              subtitle={t("ess.holidayPage.scheduleSubtitle", { year: scheduleYear })}
              items={sidebarItems}
              loading={loading}
              emptyMessage={t("ess.holidayPage.empty")}
              className="w-full"
            />
          }
        />
      </div>
    </>
  );
}
