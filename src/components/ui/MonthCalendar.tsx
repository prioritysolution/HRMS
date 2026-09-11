"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoundLoader } from "@/components/ui/RoundLoader";

export const MONTH_CALENDAR_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const MONTH_CALENDAR_WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"] as const;

export const MONTH_CALENDAR_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type MonthCalendarDayTone =
  | "default"
  | "present"
  | "absent"
  | "leave"
  | "holiday"
  | "late"
  | "half-day"
  | "weekly-off";

export type MonthCalendarDetailRow = {
  label: string;
  value: string;
};

export type MonthCalendarDayItem = {
  day: number;
  date: string;
  tone?: MonthCalendarDayTone;
  label?: string | null;
  subtitle?: string | null;
  detailTitle?: string | null;
  detailBadge?: string | null;
  detailDescription?: string | null;
  details?: MonthCalendarDetailRow[];
  isToday?: boolean;
};

export type MonthCalendarLegendItem = {
  tone: MonthCalendarDayTone;
  label: string;
};

type MonthCalendarProps = {
  year: number;
  month: number;
  days?: MonthCalendarDayItem[];
  title?: string;
  loading?: boolean;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  legend?: MonthCalendarLegendItem[];
  className?: string;
  emptyCellMinHeight?: number;
  headerExtra?: ReactNode;
};

type CalendarCell = {
  key: string;
  empty?: boolean;
  item?: MonthCalendarDayItem;
  dayNumber?: number;
  date?: string;
  weekdayIndex?: number;
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

function formatDisplayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function hasDetailContent(item?: MonthCalendarDayItem): boolean {
  if (!item) return false;
  const tone = item.tone ?? "default";
  if (tone !== "default") return true;
  return Boolean(
    item.label ||
      item.detailBadge ||
      item.detailDescription ||
      (item.details && item.details.length > 0),
  );
}

function DayDetailsPanel({
  item,
  date,
  tone,
  onClose,
  compact = false,
}: {
  item: MonthCalendarDayItem;
  date: string;
  tone: MonthCalendarDayTone;
  onClose?: () => void;
  compact?: boolean;
}) {
  const detailTitle = item.detailTitle?.trim() || item.label?.trim() || "Day details";
  const detailBadge = item.detailBadge?.trim() || tone.replace("-", " ");
  const detailDescription = item.detailDescription?.trim();
  const detailRows = item.details ?? [];

  return (
    <div className={cn("month-calendar-detail-panel", compact && "month-calendar-detail-panel--compact")}>
      <div className="month-calendar-detail-panel-head">
        <div className={cn("month-calendar-tooltip-title", `month-calendar-tooltip-title--${tone}`)}>
          <CalendarIcon size={16} />
          <span>{detailTitle}</span>
        </div>
        {onClose ? (
          <button
            type="button"
            className="month-calendar-detail-close"
            onClick={onClose}
            aria-label="Close day details"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <span className={cn("month-calendar-tooltip-badge", `month-calendar-tooltip-badge--${tone}`)}>
        {detailBadge}
      </span>

      <p className="month-calendar-tooltip-date">{formatDisplayDate(date)}</p>

      {detailDescription ? (
        <p className="month-calendar-tooltip-desc">{detailDescription}</p>
      ) : null}

      {detailRows.length > 0 ? (
        <dl className="month-calendar-tooltip-rows">
          {detailRows.map((row) => (
            <div key={`${row.label}-${row.value}`} className="month-calendar-tooltip-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function DayCellContent({
  cell,
  year,
  month,
  minHeight,
  selectedKey,
  onSelect,
  compact = false,
}: {
  cell: CalendarCell;
  year: number;
  month: number;
  minHeight: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  compact?: boolean;
}) {
  if (cell.empty) {
    return (
      <div
        className={cn(
          "month-calendar-cell month-calendar-cell--empty",
          compact && "month-calendar-cell--compact",
        )}
        style={{ minHeight }}
      />
    );
  }

  const item = cell.item;
  const tone = item?.tone ?? "default";
  const isToday = Boolean(item?.isToday);
  const label = item?.label?.trim();
  const subtitle = item?.subtitle?.trim();
  const canShowDetails = hasDetailContent(item);
  const isSelected = selectedKey === cell.key;

  return (
    <button
      type="button"
      className={cn(
        "month-calendar-cell group transition-colors text-left",
        `month-calendar-cell--${tone}`,
        isSelected && "month-calendar-cell--selected",
        canShowDetails && "month-calendar-cell--interactive",
        compact && "month-calendar-cell--compact",
      )}
      style={{ minHeight }}
      onClick={() => {
        if (!canShowDetails) return;
        onSelect(cell.key);
      }}
    >
      <span
        className={cn(
          "month-calendar-daynum-wrap inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
          isToday
            ? "bg-primary text-white shadow-md scale-110"
            : tone === "default"
              ? "text-muted group-hover:text-primary"
              : `month-calendar-daynum month-calendar-daynum--${tone}`,
        )}
      >
        {cell.dayNumber}
      </span>

      {compact ? (
        tone !== "default" ? (
          <span
            className={cn("month-calendar-dot", `month-calendar-dot--${tone}`)}
            title={label || undefined}
          />
        ) : null
      ) : label ? (
        <div className="month-calendar-chip-wrap">
          <div className={cn("month-calendar-chip", `month-calendar-chip--${tone}`)}>
            <span className="month-calendar-chip-label">{label}</span>
            {subtitle ? (
              <span className="month-calendar-chip-sub">{subtitle}</span>
            ) : null}
          </div>
        </div>
      ) : tone !== "default" ? (
        <span className={cn("month-calendar-dot", `month-calendar-dot--${tone}`)} />
      ) : (
        <span className="month-calendar-cell-spacer" aria-hidden />
      )}

      {!compact && canShowDetails ? (
        <div className="month-calendar-tooltip">
          <div className="month-calendar-tooltip-arrow" />
          <DayDetailsPanel
            item={item!}
            date={cell.date || toIsoDate(year, month, cell.dayNumber || 1)}
            tone={tone}
            compact
          />
        </div>
      ) : null}
    </button>
  );
}

export function MonthCalendar({
  year,
  month,
  days = [],
  title = "Calendar View",
  loading = false,
  onPrevMonth,
  onNextMonth,
  legend,
  className,
  emptyCellMinHeight = 112,
  headerExtra,
}: MonthCalendarProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const monthIndex0 = Math.max(0, Math.min(11, month - 1));
  const daysInMonth = getDaysInMonth(year, monthIndex0);
  const firstDay = getFirstWeekdaySunday(year, monthIndex0);

  useEffect(() => {
    setSelectedKey(null);
  }, [year, month]);

  const dayMap = useMemo(() => {
    const map = new Map<number, MonthCalendarDayItem>();
    for (const item of days) {
      map.set(item.day, item);
    }
    return map;
  }, [days]);

  const weeks = useMemo(() => {
    const flat: CalendarCell[] = [];

    for (let i = 0; i < firstDay; i++) {
      flat.push({ key: `empty-start-${i}`, empty: true, weekdayIndex: i });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const item = dayMap.get(d);
      const weekdayIndex = (firstDay + d - 1) % 7;
      flat.push({
        key: `day-${d}`,
        dayNumber: d,
        date: item?.date || toIsoDate(year, month, d),
        item,
        weekdayIndex,
      });
    }

    while (flat.length % 7 !== 0) {
      flat.push({
        key: `empty-end-${flat.length}`,
        empty: true,
        weekdayIndex: flat.length % 7,
      });
    }

    const rows: CalendarCell[][] = [];
    for (let i = 0; i < flat.length; i += 7) {
      rows.push(flat.slice(i, i + 7));
    }
    return rows;
  }, [dayMap, daysInMonth, firstDay, month, year]);

  const selectedCell = useMemo(() => {
    if (!selectedKey) return null;
    for (const week of weeks) {
      const found = week.find((cell) => cell.key === selectedKey && !cell.empty);
      if (found) return found;
    }
    return null;
  }, [selectedKey, weeks]);

  const handleSelect = (key: string) => {
    setSelectedKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className={cn("card month-calendar border-0 shadow-sm", className)}>
      <div className="card-header month-calendar-header bg-card border-b border-[var(--border)] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h5 className="card-title mb-0 text-lg font-bold text-title truncate">{title}</h5>
          {headerExtra}
        </div>
        <div className="month-calendar-nav flex items-center gap-3 sm:gap-4 bg-[var(--card-soft)] rounded-full p-1.5 border border-[var(--border)] self-stretch sm:self-auto justify-between sm:justify-center">
          <button
            type="button"
            onClick={onPrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card hover:shadow-sm text-secondary transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-sm min-w-[120px] text-center text-title">
            {MONTH_CALENDAR_MONTHS[monthIndex0]} {year}
          </span>
          <button
            type="button"
            onClick={onNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card hover:shadow-sm text-secondary transition-all"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="card-body p-0 relative">
        {loading ? (
          <div className="month-calendar-loading">
            <RoundLoader />
            <p>Loading calendar…</p>
          </div>
        ) : null}

        {/* Desktop / landscape: classic week-row grid */}
        <div className="month-calendar-scroll month-calendar-scroll--grid">
          <div className="month-calendar-board month-calendar-board--grid">
            <div className="month-calendar-weekdays">
              {MONTH_CALENDAR_WEEKDAYS.map((day, index) => (
                <div key={day} className="month-calendar-weekday">
                  <span className="month-calendar-weekday-full">{day}</span>
                  <span className="month-calendar-weekday-short">
                    {MONTH_CALENDAR_WEEKDAYS_SHORT[index]}
                  </span>
                </div>
              ))}
            </div>

            <div className="month-calendar-weeks">
              {weeks.map((week, weekIndex) => (
                <div key={`week-grid-${weekIndex}`} className="month-calendar-week-row">
                  {week.map((cell) => (
                    <DayCellContent
                      key={cell.key}
                      cell={cell}
                      year={year}
                      month={month}
                      minHeight={emptyCellMinHeight}
                      selectedKey={selectedKey}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile portrait: one table — day names in first column, weeks across */}
        <div className="month-calendar-scroll month-calendar-scroll--mobile">
          <div
            className="month-calendar-board month-calendar-board--mobile"
            style={{
              ["--week-count" as string]: String(Math.max(weeks.length, 1)),
            }}
          >
            <div className="month-calendar-mobile-head">
              <div className="month-calendar-mobile-corner">Day</div>
              {weeks.map((_, weekIndex) => (
                <div key={`week-head-${weekIndex}`} className="month-calendar-mobile-week-head">
                  W{weekIndex + 1}
                </div>
              ))}
            </div>

            {MONTH_CALENDAR_WEEKDAYS.map((dayName, weekdayIndex) => (
              <div key={dayName} className="month-calendar-mobile-row">
                <div className="month-calendar-day-col">
                  <span className="month-calendar-day-col-full">{dayName}</span>
                  <span className="month-calendar-day-col-short">
                    {MONTH_CALENDAR_WEEKDAYS_SHORT[weekdayIndex]}
                  </span>
                </div>
                {weeks.map((week, weekIndex) => {
                  const cell = week[weekdayIndex];
                  return (
                    <div key={`${weekIndex}-${weekdayIndex}`} className="month-calendar-mobile-cell">
                      <DayCellContent
                        cell={cell}
                        year={year}
                        month={month}
                        minHeight={56}
                        selectedKey={selectedKey}
                        onSelect={handleSelect}
                        compact
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {selectedCell?.item && hasDetailContent(selectedCell.item) ? (
          <div className="month-calendar-mobile-detail">
            <DayDetailsPanel
              item={selectedCell.item}
              date={
                selectedCell.date ||
                toIsoDate(year, month, selectedCell.dayNumber || 1)
              }
              tone={selectedCell.item.tone ?? "default"}
              onClose={() => setSelectedKey(null)}
            />
          </div>
        ) : null}

        <p className="month-calendar-mobile-hint">Tap a day to view details</p>

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
