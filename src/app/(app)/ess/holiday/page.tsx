"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

const MOCK_HOLIDAYS = [
  { id: 1, date: "2026-01-01", name: "New Year's Day", type: "Public Holiday", description: "First day of the year. Let's celebrate new beginnings!" },
  { id: 2, date: "2026-01-26", name: "Republic Day", type: "National Holiday", description: "Anniversary of the Constitution of India coming into effect." },
  { id: 3, date: "2026-03-03", name: "Holi", type: "Restricted Holiday", description: "Festival of colors, marking the arrival of spring." },
  { id: 4, date: "2026-05-01", name: "Labour Day", type: "Public Holiday", description: "Celebration of laborers and the working classes." },
  { id: 5, date: "2026-08-15", name: "Independence Day", type: "National Holiday", description: "Commemorating the Independence of India in 1947." },
  { id: 6, date: "2026-09-07", name: "Ganesh Chaturthi", type: "Restricted Holiday", description: "Hindu festival celebrating the birth of Lord Ganesha." },
  { id: 7, date: "2026-10-02", name: "Gandhi Jayanti", type: "National Holiday", description: "Birth anniversary of Mahatma Gandhi, the father of the nation." },
  { id: 8, date: "2026-10-23", name: "Dussehra", type: "Public Holiday", description: "Vijayadashami festival marking the victory of good over evil." },
  { id: 9, date: "2026-11-12", name: "Diwali", type: "Public Holiday", description: "Festival of lights, one of the most popular Hindu festivals." },
  { id: 10, date: "2026-12-25", name: "Christmas Day", type: "Public Holiday", description: "Annual festival commemorating the birth of Jesus Christ." },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helpers
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

export default function EssHolidaysPage() {
  const today = useMemo(() => new Date(), []);
  
  const sortedHolidays = useMemo(() => [...MOCK_HOLIDAYS].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()), []);
  const nextHolidayIndex = useMemo(() => {
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return sortedHolidays.findIndex(h => parseDate(h.date) >= normalizedToday);
  }, [sortedHolidays, today]);
  
  const initialMonth = nextHolidayIndex !== -1 
    ? parseDate(sortedHolidays[nextHolidayIndex].date) 
    : today;

  const [currentDate, setCurrentDate] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const listRef = useRef<HTMLDivElement>(null);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  useEffect(() => {
    if (listRef.current) {
      setTimeout(() => {
        const activeEl = listRef.current?.querySelector('[data-upcoming="true"]') as HTMLElement;
        const container = listRef.current;
        if (activeEl && container) {
          // Calculate the scroll position manually to prevent the entire page/window from scrolling
          const scrollPos = activeEl.offsetTop - container.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
          container.scrollTo({
            top: Math.max(0, scrollPos),
            behavior: "smooth"
          });
        }
      }, 300);
    }
  }, []);

  const cells = useMemo(() => {
    const grid = [];
    
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      grid.push(<div key={`empty-${i}`} className="min-h-[100px] bg-[var(--body-bg)] border-r border-b border-[var(--border)]"></div>);
    }

    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const holiday = MOCK_HOLIDAYS.find((h) => isSameDay(parseDate(h.date), cellDate));
      const isToday = isSameDay(today, cellDate);

      grid.push(
        <div
          key={`day-${d}`}
          className={cn(
            "min-h-[100px] border-r border-b border-[var(--border)] p-2 relative group transition-colors",
            holiday
              ? "bg-[var(--danger-soft)]"
              : "bg-card hover:bg-[var(--card-soft)]"
          )}
        >
          <div className="flex justify-between items-start">
            <span
              className={cn(
                "inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                isToday 
                  ? "bg-primary text-white shadow-md scale-110"
                  : holiday
                    ? "bg-danger text-white shadow-sm"
                    : "text-muted group-hover:text-primary"
              )}
            >
              {d}
            </span>
          </div>

          {holiday && (
            <div className="mt-2 px-1 flex flex-col relative w-full">
              <div className="bg-white dark:bg-[var(--card-bg)] border border-[var(--border)] rounded p-1.5 cursor-default shadow-sm">
                <span className="block text-[11px] font-bold text-danger leading-tight truncate">
                  {holiday.name}
                </span>
              </div>

              {/* Hover Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 p-4 bg-card border border-[var(--border)] rounded-xl shadow opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none scale-95 group-hover:scale-100">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-t border-l border-[var(--border)] rotate-45"></div>
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-danger">
                    <CalendarIcon size={16} />
                    <span className="font-bold text-sm text-title">{holiday.name}</span>
                  </div>
                  <span className="badge bg-soft-danger w-fit uppercase tracking-wider text-[10px]">
                    {holiday.type}
                  </span>
                  <p className="text-xs text-muted leading-relaxed mt-1">
                    {holiday.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Fill remaining cells
    const remainingCells = 42 - (firstDay + daysInMonth);
    for (let i = 0; i < remainingCells; i++) {
      grid.push(<div key={`empty-end-${i}`} className="min-h-[100px] bg-[var(--body-bg)] border-r border-b border-[var(--border)]"></div>);
    }

    return grid;
  }, [year, month, today]);

  return (
    <>
      <PageHeader title="Holiday Calendar" section="Employee Self Service" />
      <div className="container-fluid py-6 animate-in fade-in duration-300">
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Main Calendar Section */}
          <div className="flex-1 card min-h-0 border-0 shadow-sm overflow-hidden">
            <div className="card-header bg-card border-b border-[var(--border)] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h5 className="card-title mb-0 flex items-center gap-2 text-lg font-bold text-title">
                Calendar View
              </h5>
              <div className="flex items-center gap-4 bg-[var(--card-soft)] rounded-full p-1.5 border border-[var(--border)]">
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card hover:shadow-sm text-secondary transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-bold text-sm min-w-[120px] text-center text-title">
                  {MONTHS[month]} {year}
                </span>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-card hover:shadow-sm text-secondary transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            
            <div className="card-body p-0">
              <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--card-soft)]">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center font-semibold text-muted text-[11px] uppercase tracking-widest py-3 border-r border-[var(--border)] last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-l border-[var(--border)] -ml-[1px]">
                {cells}
              </div>
            </div>
          </div>

          {/* Side List Section */}
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
                    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const isUpcoming = hDate >= normalizedToday;
                    const isNextUpcoming = idx === nextHolidayIndex;
                    
                    return (
                      <div
                        key={holiday.id}
                        data-upcoming={isNextUpcoming ? "true" : undefined}
                        className={cn(
                          "p-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card-soft)] transition-colors flex gap-4 items-start relative",
                          !isUpcoming && "opacity-50"
                        )}
                      >
                        {isNextUpcoming && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        )}
                        <div className="flex flex-col items-center justify-center w-12 h-12 flex-shrink-0 bg-[var(--body-bg)] rounded-lg text-title border border-[var(--border)]">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                            {MONTHS[hDate.getMonth()].slice(0, 3)}
                          </span>
                          <span className="text-lg font-black leading-none mt-0.5">
                            {hDate.getDate()}
                          </span>
                        </div>
                        <div className="flex flex-col pt-0.5">
                          <h4 className="font-bold text-title text-sm flex items-center gap-2">
                            {holiday.name}
                            {isNextUpcoming && (
                              <span className="badge bg-soft-primary uppercase tracking-wider text-[9px] px-1.5 py-0.5">
                                Next
                              </span>
                            )}
                          </h4>
                          <span className="text-xs text-muted mt-1 flex items-center gap-1.5 font-medium">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              holiday.type === "Public Holiday" ? "bg-success" : 
                              holiday.type === "National Holiday" ? "bg-info" : "bg-warning"
                            )}></span>
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
