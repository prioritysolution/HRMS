"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MonthCalendar,
  MONTH_CALENDAR_MONTHS,
  type MonthCalendarDayItem,
} from "@/components/ui/MonthCalendar";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { isSameDay } from "@/lib/date-utils";

const MOCK_HOLIDAYS = [
  {
    id: 1,
    date: "2026-01-01",
    name: "New Year's Day",
    type: "Public Holiday",
    description: "First day of the year. Let's celebrate new beginnings!",
  },
  {
    id: 2,
    date: "2026-01-26",
    name: "Republic Day",
    type: "National Holiday",
    description: "Anniversary of the Constitution of India coming into effect.",
  },
  {
    id: 3,
    date: "2026-03-03",
    name: "Holi",
    type: "Restricted Holiday",
    description: "Festival of colors, marking the arrival of spring.",
  },
  {
    id: 4,
    date: "2026-05-01",
    name: "Labour Day",
    type: "Public Holiday",
    description: "Celebration of laborers and the working classes.",
  },
  {
    id: 5,
    date: "2026-08-15",
    name: "Independence Day",
    type: "National Holiday",
    description: "Commemorating the Independence of India in 1947.",
  },
  {
    id: 6,
    date: "2026-09-07",
    name: "Ganesh Chaturthi",
    type: "Restricted Holiday",
    description: "Hindu festival celebrating the birth of Lord Ganesha.",
  },
  {
    id: 7,
    date: "2026-10-02",
    name: "Gandhi Jayanti",
    type: "National Holiday",
    description: "Birth anniversary of Mahatma Gandhi, the father of the nation.",
  },
  {
    id: 8,
    date: "2026-10-23",
    name: "Dussehra",
    type: "Public Holiday",
    description: "Vijayadashami festival marking the victory of good over evil.",
  },
  {
    id: 9,
    date: "2026-11-12",
    name: "Diwali",
    type: "Public Holiday",
    description: "Festival of lights, one of the most popular Hindu festivals.",
  },
  {
    id: 10,
    date: "2026-12-25",
    name: "Christmas Day",
    type: "Public Holiday",
    description: "Annual festival commemorating the birth of Jesus Christ.",
  },
];

function parseDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function EssHolidaysPage() {
  const today = useMemo(() => new Date(), []);

  const sortedHolidays = useMemo(
    () =>
      [...MOCK_HOLIDAYS].sort(
        (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime(),
      ),
    [],
  );

  const nextHolidayIndex = useMemo(() => {
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return sortedHolidays.findIndex((h) => parseDate(h.date) >= normalizedToday);
  }, [sortedHolidays, today]);

  const initialMonth =
    nextHolidayIndex !== -1 ? parseDate(sortedHolidays[nextHolidayIndex].date) : today;

  const [year, setYear] = useState(initialMonth.getFullYear());
  const [month, setMonth] = useState(initialMonth.getMonth() + 1);
  const listRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!listRef.current) return;
    const timer = window.setTimeout(() => {
      const activeEl = listRef.current?.querySelector('[data-upcoming="true"]') as HTMLElement | null;
      const container = listRef.current;
      if (!activeEl || !container) return;
      const scrollPos =
        activeEl.offsetTop -
        container.offsetTop -
        container.clientHeight / 2 +
        activeEl.clientHeight / 2;
      container.scrollTo({
        top: Math.max(0, scrollPos),
        behavior: "smooth",
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  const calendarDays: MonthCalendarDayItem[] = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const items: MonthCalendarDayItem[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const cellDate = parseDate(date);
      const holiday = MOCK_HOLIDAYS.find((h) => isSameDay(parseDate(h.date), cellDate));
      items.push({
        day: d,
        date,
        isToday: isSameDay(today, cellDate),
        tone: holiday ? "holiday" : "default",
        label: holiday?.name,
        subtitle: holiday?.type,
        detailTitle: holiday?.name,
        detailBadge: holiday?.type,
        detailDescription: holiday?.description,
        details: holiday
          ? [
              { label: "Type", value: holiday.type },
              {
                label: "Date",
                value: cellDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
              },
            ]
          : undefined,
      });
    }

    return items;
  }, [month, today, year]);

  return (
    <>
      <PageHeader title="Holiday Calendar" section="Employee Self Service" />
      <div className="container-fluid py-6 animate-in fade-in duration-300">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 min-h-0">
            <MonthCalendar
              year={year}
              month={month}
              days={calendarDays}
              title="Calendar View"
              onPrevMonth={goPrev}
              onNextMonth={goNext}
              legend={[{ tone: "holiday", label: "Holiday" }]}
            />
          </div>

          <div className="w-full xl:w-[400px] flex flex-col gap-4">
            <div className="card h-[calc(100vh-140px)] border-0 shadow-sm flex flex-col overflow-hidden">
              <div className="card-header bg-card border-b border-[var(--border)] p-5">
                <h5 className="card-title mb-0 text-lg font-bold text-title">Upcoming Holidays</h5>
                <p className="text-xs text-muted mt-1">Corporate schedule for 2026</p>
              </div>

              <div className="card-body p-0 overflow-y-auto custom-scrollbar" ref={listRef}>
                <div className="flex flex-col">
                  {sortedHolidays.map((holiday, idx) => {
                    const hDate = parseDate(holiday.date);
                    const normalizedToday = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                    );
                    const isUpcoming = hDate >= normalizedToday;
                    const isNextUpcoming = idx === nextHolidayIndex;

                    return (
                      <div
                        key={holiday.id}
                        data-upcoming={isNextUpcoming ? "true" : undefined}
                        className={cn(
                          "p-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card-soft)] transition-colors flex gap-4 items-start relative",
                          !isUpcoming && "opacity-50",
                        )}
                      >
                        {isNextUpcoming ? (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        ) : null}
                        <div className="flex flex-col items-center justify-center w-12 h-12 flex-shrink-0 bg-[var(--body-bg)] rounded-lg text-title border border-[var(--border)]">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                            {MONTH_CALENDAR_MONTHS[hDate.getMonth()].slice(0, 3)}
                          </span>
                          <span className="text-lg font-black leading-none mt-0.5">
                            {hDate.getDate()}
                          </span>
                        </div>
                        <div className="flex flex-col pt-0.5">
                          <h4 className="font-bold text-title text-sm flex items-center gap-2">
                            {holiday.name}
                            {isNextUpcoming ? (
                              <span className="badge bg-soft-primary uppercase tracking-wider text-[9px] px-1.5 py-0.5">
                                Next
                              </span>
                            ) : null}
                          </h4>
                          <span className="text-xs text-muted mt-1 flex items-center gap-1.5 font-medium">
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                holiday.type === "Public Holiday"
                                  ? "bg-success"
                                  : holiday.type === "National Holiday"
                                    ? "bg-info"
                                    : "bg-warning",
                              )}
                            />
                            {holiday.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
