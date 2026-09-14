"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { RoundLoader } from "@/components/ui/RoundLoader";
import {
  MONTH_CALENDAR_MONTHS,
  MONTH_CALENDAR_WEEKDAYS_SHORT,
  type MonthCalendarDayItem,
  type MonthCalendarLegendItem,
} from "@/components/ui/MonthCalendar";
import { cn } from "@/lib/utils";

type YearCalendarProps = {
  year: number;
  days?: MonthCalendarDayItem[];
  title?: string;
  loading?: boolean;
  onPrevYear?: () => void;
  onNextYear?: () => void;
  onYearChange?: (year: number) => void;
  /** Optional: click a month title to open month view. */
  onMonthSelect?: (month: number) => void;
  onDayClick?: (date: string, item?: MonthCalendarDayItem) => void;
  legend?: MonthCalendarLegendItem[];
  className?: string;
  headerExtra?: ReactNode;
  yearRange?: { start: number; end: number };
};

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function getFirstWeekdaySunday(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0, 1).getDay();
}

type MiniCell = {
  key: string;
  empty?: boolean;
  dayNumber?: number;
  date?: string;
  item?: MonthCalendarDayItem;
};

function buildMonthCells(
  year: number,
  month: number,
  dayByDate: Map<string, MonthCalendarDayItem>,
): MiniCell[] {
  const monthIndex0 = month - 1;
  const daysInMonth = getDaysInMonth(year, monthIndex0);
  const firstDay = getFirstWeekdaySunday(year, monthIndex0);
  const cells: MiniCell[] = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ key: `m${month}-e${i}`, empty: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toIsoDate(year, month, day);
    cells.push({
      key: `m${month}-d${day}`,
      dayNumber: day,
      date,
      item: dayByDate.get(date),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `m${month}-t${cells.length}`, empty: true });
  }

  return cells;
}

export function YearCalendar({
  year,
  days = [],
  title = "Year Calendar",
  loading = false,
  onPrevYear,
  onNextYear,
  onYearChange,
  onMonthSelect,
  onDayClick,
  legend,
  className,
  headerExtra,
  yearRange,
}: YearCalendarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const canPickYear = Boolean(onYearChange);

  const resolvedYearRange = useMemo(() => {
    const current = new Date().getFullYear();
    return {
      start: yearRange?.start ?? current - 10,
      end: yearRange?.end ?? current + 5,
    };
  }, [yearRange]);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = resolvedYearRange.end; y >= resolvedYearRange.start; y -= 1) {
      years.push(y);
    }
    return years;
  }, [resolvedYearRange]);

  const dayByDate = useMemo(() => {
    const map = new Map<string, MonthCalendarDayItem>();
    for (const item of days) {
      if (item.date) map.set(item.date, item);
    }
    return map;
  }, [days]);

  const months = useMemo(
    () =>
      MONTH_CALENDAR_MONTHS.map((name, index) => {
        const month = index + 1;
        return {
          month,
          name,
          cells: buildMonthCells(year, month, dayByDate),
        };
      }),
    [dayByDate, year],
  );

  useEffect(() => {
    setPickerOpen(false);
  }, [year]);

  useEffect(() => {
    if (!pickerOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pickerOpen]);

  return (
    <div className={cn("card month-calendar year-calendar shadow-sm", className)}>
      <div className="card-header month-calendar-header bg-card border-b border-[var(--border)] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h5 className="card-title mb-0 text-lg font-bold text-title truncate">{title}</h5>
          {headerExtra}
        </div>

        <div
          ref={pickerRef}
          className="month-calendar-nav relative flex items-center gap-2 sm:gap-3 bg-[var(--card-soft)] rounded-full p-1.5 border border-[var(--border)] self-stretch sm:self-auto justify-between sm:justify-center"
        >
          <button
            type="button"
            onClick={onPrevYear}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card hover:shadow-sm text-secondary transition-all"
            aria-label="Previous year"
          >
            <ChevronLeft size={18} />
          </button>

          {canPickYear ? (
            <button
              type="button"
              className="month-calendar-period-btn font-bold text-sm min-w-[88px] px-2 py-1 rounded-full text-center text-title inline-flex items-center justify-center gap-1 hover:bg-card hover:shadow-sm transition-all"
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((open) => !open)}
            >
              <span>{year}</span>
              <ChevronDown
                size={14}
                className={cn(
                  "text-secondary transition-transform",
                  pickerOpen && "rotate-180",
                )}
              />
            </button>
          ) : (
            <span className="font-bold text-sm min-w-[72px] text-center text-title">{year}</span>
          )}

          <button
            type="button"
            onClick={onNextYear}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card hover:shadow-sm text-secondary transition-all"
            aria-label="Next year"
          >
            <ChevronRight size={18} />
          </button>

          {canPickYear && pickerOpen ? (
            <div className="month-calendar-period-popover" role="dialog" aria-label="Select year">
              <div className="month-calendar-period-section">
                <p className="month-calendar-period-label">Year</p>
                <div className="month-calendar-year-grid">
                  {yearOptions.map((optionYear) => (
                    <button
                      key={optionYear}
                      type="button"
                      className={cn(
                        "month-calendar-period-option",
                        optionYear === year && "is-active",
                      )}
                      onClick={() => {
                        onYearChange?.(optionYear);
                        setPickerOpen(false);
                      }}
                    >
                      {optionYear}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card-body p-0 relative">
        {loading ? (
          <div className="month-calendar-loading">
            <RoundLoader />
            <p>Loading calendar…</p>
          </div>
        ) : null}

        <div className="year-calendar-grid">
          {months.map(({ month, name, cells }) => (
            <section key={month} className="year-calendar-month">
              {onMonthSelect ? (
                <button
                  type="button"
                  className="year-calendar-month-title year-calendar-month-title--link"
                  onClick={() => onMonthSelect(month)}
                >
                  {name}
                </button>
              ) : (
                <h6 className="year-calendar-month-title">{name}</h6>
              )}

              <div className="year-calendar-weekdays">
                {MONTH_CALENDAR_WEEKDAYS_SHORT.map((day, index) => (
                  <span key={`${month}-${day}-${index}`} className="year-calendar-weekday">
                    {day}
                  </span>
                ))}
              </div>

              <div className="year-calendar-days">
                {cells.map((cell) => {
                  if (cell.empty) {
                    return <div key={cell.key} className="year-calendar-day year-calendar-day--empty" />;
                  }

                  const tone = cell.item?.tone ?? "default";
                  const isToday = Boolean(cell.item?.isToday);
                  const hasHoliday = tone === "holiday";
                  const label = cell.item?.label?.trim();

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      title={label || undefined}
                      className={cn(
                        "year-calendar-day",
                        hasHoliday && "year-calendar-day--holiday",
                        isToday && "year-calendar-day--today",
                        onDayClick && "year-calendar-day--interactive",
                      )}
                      onClick={() => {
                        if (!cell.date || !onDayClick) return;
                        onDayClick(cell.date, cell.item);
                      }}
                    >
                      <span>{cell.dayNumber}</span>
                      {hasHoliday ? <i className="year-calendar-day-dot" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {legend && legend.length > 0 ? (
          <div className="month-calendar-legend">
            {legend.map((item) => (
              <div key={item.tone} className="month-calendar-legend-item">
                <span
                  className={cn(
                    "month-calendar-legend-swatch",
                    `month-calendar-legend-swatch--${item.tone}`,
                  )}
                />
                <em>{item.label}</em>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
