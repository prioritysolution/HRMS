"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { getLocalizedMonthName } from "@/components/ui/MonthCalendar";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { parseDateToIso } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { useI18n, translateHrmsLookup } from "@/i18n";

export type CalendarSidebarItem = {
  id: string | number;
  date: string;
  title: string;
  meta?: string;
  /** Dot color class, e.g. `bg-success` / `bg-warning`. */
  metaToneClass?: string;
  /** Dim past / inactive rows. */
  muted?: boolean;
  /** Highlight as the next upcoming item. */
  isNext?: boolean;
  badge?: string;
};

type CalendarDetailsSidebarProps = {
  title: string;
  subtitle?: ReactNode;
  items: CalendarSidebarItem[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onItemClick?: (item: CalendarSidebarItem) => void;
};

function parseIsoDate(dateStr: string): Date | null {
  const iso = parseDateToIso(dateStr) || dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function holidayTypeToneClass(typeName: string): string {
  const value = typeName.toLowerCase();
  if (value.includes("public")) return "bg-success";
  if (value.includes("national")) return "bg-info";
  if (value.includes("weekly")) return "bg-secondary";
  return "bg-warning";
}

export function attendanceToneClass(tone: string): string {
  switch (tone) {
    case "present":
      return "bg-success";
    case "absent":
      return "bg-danger";
    case "leave":
      return "bg-primary";
    case "holiday":
      return "bg-danger";
    case "late":
      return "bg-warning";
    case "half-day":
      return "bg-warning";
    case "weekly-off":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
}

export function CalendarDetailsSidebar({
  title,
  subtitle,
  items,
  loading = false,
  emptyMessage = "No items found for this period.",
  className,
  onItemClick,
}: CalendarDetailsSidebarProps) {
  const { language, t } = useI18n();
  const listRef = useRef<HTMLDivElement>(null);
  const nextId = useMemo(
    () => items.find((item) => item.isNext)?.id ?? null,
    [items],
  );

  useEffect(() => {
    if (!listRef.current || loading) return;
    const timer = window.setTimeout(() => {
      const activeEl = listRef.current?.querySelector(
        '[data-upcoming="true"]',
      ) as HTMLElement | null;
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
  }, [loading, nextId, items]);

  return (
    <div
      className={cn(
        "card calendar-details-sidebar h-full border shadow-sm flex flex-col overflow-hidden",
        className,
      )}
    >
      <div className="card-header bg-card border-b border-[var(--border)] p-5 shrink-0">
        <h5 className="card-title mb-0 text-lg font-bold text-title">
          {translateHrmsLookup(language, "titles", title)}
        </h5>
        {subtitle ? <p className="text-xs text-muted mt-1 mb-0">{subtitle}</p> : null}
      </div>

      <div className="card-body p-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar" ref={listRef}>
        {loading && items.length === 0 ? (
          <div className="employee-profile-loading py-10">
            <RoundLoader />
            <p>{t("common.loading")}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-5 text-sm text-muted">{emptyMessage}</div>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => {
              const hDate = parseIsoDate(item.date);
              const isNext = Boolean(item.isNext);

              const content = (
                <>
                  {isNext ? (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  ) : null}
                  <div className="flex flex-col items-center justify-center w-12 h-12 flex-shrink-0 bg-[var(--body-bg)] rounded-lg text-title border border-[var(--border)]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                      {hDate
                        ? getLocalizedMonthName(hDate.getMonth() + 1, language, "short").slice(0, 4)
                        : "—"}
                    </span>
                    <span className="text-lg font-black leading-none mt-0.5">
                      {hDate ? hDate.getDate() : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col pt-0.5 min-w-0">
                    <h4 className="font-bold text-title text-sm flex items-center gap-2 flex-wrap mb-0">
                      <span className="truncate">
                        {translateHrmsLookup(language, "headers", item.title)}
                      </span>
                      {isNext || item.badge ? (
                        <span className="badge bg-soft-primary uppercase tracking-wider text-[9px] px-1.5 py-0.5">
                          {item.badge
                            ? translateHrmsLookup(language, "headers", item.badge)
                            : t("attendance.holidays.next")}
                        </span>
                      ) : null}
                    </h4>
                    {item.meta ? (
                      <span className="text-xs text-muted mt-1 flex items-center gap-1.5 font-medium">
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            item.metaToneClass || "bg-warning",
                          )}
                        />
                        {translateHrmsLookup(language, "headers", item.meta)}
                      </span>
                    ) : null}
                  </div>
                </>
              );

              const rowClass = cn(
                "p-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card-soft)] transition-colors flex gap-4 items-start relative w-full text-left",
                item.muted && "opacity-50",
              );

              if (onItemClick) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-upcoming={isNext ? "true" : undefined}
                    className={rowClass}
                    onClick={() => onItemClick(item)}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <div
                  key={item.id}
                  data-upcoming={isNext ? "true" : undefined}
                  className={rowClass}
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
