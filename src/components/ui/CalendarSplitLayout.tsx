"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type CalendarSplitLayoutProps = {
  calendar: ReactNode;
  sidebar: ReactNode;
  className?: string;
  /** Remeasure when month/year/view changes. */
  syncKey?: string | number;
};

const DESKTOP_MQ = "(min-width: 992px)";

function readCalendarHeight(wrapper: HTMLElement): number {
  const card = wrapper.querySelector<HTMLElement>(
    ".month-calendar, .year-calendar, .card",
  );
  const target = card ?? wrapper;
  return Math.round(target.getBoundingClientRect().height);
}

/**
 * Keeps the details sidebar the same height as the calendar card.
 * Recalculates whenever the calendar size changes.
 */
export function CalendarSplitLayout({
  calendar,
  sidebar,
  className,
  syncKey,
}: CalendarSplitLayoutProps) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [sidebarHeight, setSidebarHeight] = useState<number | undefined>();

  useLayoutEffect(() => {
    const node = calendarRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const isDesktop =
          typeof window.matchMedia === "function"
            ? window.matchMedia(DESKTOP_MQ).matches
            : true;
        if (!isDesktop) {
          setSidebarHeight(undefined);
          return;
        }
        const next = readCalendarHeight(node);
        if (next <= 0) return;
        setSidebarHeight((prev) => (prev === next ? prev : next));
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    const card = node.querySelector<HTMLElement>(
      ".month-calendar, .year-calendar, .card",
    );
    if (card) observer.observe(card);

    window.addEventListener("resize", update);
    const media = window.matchMedia(DESKTOP_MQ);
    media.addEventListener?.("change", update);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
      media.removeEventListener?.("change", update);
    };
  }, [syncKey]);

  return (
    <div
      className={cn(
        "calendar-split-layout flex flex-col lg:flex-row gap-6",
        className,
      )}
    >
      <div ref={calendarRef} className="calendar-split-layout__main flex-1 min-w-0">
        {calendar}
      </div>
      <div
        className="calendar-split-layout__side w-full lg:w-[360px] xl:w-[400px] lg:shrink-0"
        style={
          sidebarHeight && sidebarHeight > 0
            ? { height: sidebarHeight }
            : undefined
        }
      >
        {sidebar}
      </div>
    </div>
  );
}
