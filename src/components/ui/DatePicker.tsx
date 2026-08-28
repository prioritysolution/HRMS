"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  dateToIso,
  formatDateDisplay,
  formatInputMask,
  getCalendarDays,
  isSameDay,
  isValidDateValue,
  isoToDate,
  parseDateToIso,
  WEEKDAY_LABELS,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

type DatePickerProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
  min?: string;
  max?: string;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  placement: "bottom" | "top";
};

const MONTH_NAMES = [
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
];

const YEAR_START = 1950;
const YEAR_AHEAD = 25;
const DROPDOWN_GAP = 8;
const DROPDOWN_MIN_HEIGHT = 340;
const DROPDOWN_MIN_WIDTH = 320;

function buildYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + YEAR_AHEAD;
  return Array.from({ length: endYear - YEAR_START + 1 }, (_, index) => YEAR_START + index);
}

function getDropdownPosition(anchor: HTMLElement): DropdownPosition {
  const rect = anchor.getBoundingClientRect();
  const width = Math.max(rect.width, DROPDOWN_MIN_WIDTH);
  const maxLeft = Math.max(8, window.innerWidth - width - 8);
  const left = Math.min(Math.max(8, rect.left), maxLeft);

  const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_GAP;
  const spaceAbove = rect.top - DROPDOWN_GAP;
  const placement =
    spaceBelow < DROPDOWN_MIN_HEIGHT && spaceAbove > spaceBelow ? "top" : "bottom";

  const top =
    placement === "bottom" ? rect.bottom + DROPDOWN_GAP : rect.top - DROPDOWN_GAP;

  return { top, left, width, placement };
}

export function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "dd-mm-yyyy",
  disabled = false,
  className,
  clearable = true,
  min,
  max,
}: DatePickerProps) {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ignoreBlurRef = useRef(false);

  const storageValue = useMemo(() => parseDateToIso(value), [value]);
  const selectedDate = useMemo(() => isoToDate(storageValue), [storageValue]);
  const yearOptions = useMemo(() => buildYearOptions(), []);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(() => formatDateDisplay(value));
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);

  const updateDropdownPosition = useCallback(() => {
    if (!controlRef.current) return;
    setDropdownPosition(getDropdownPosition(controlRef.current));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setInputText(formatDateDisplay(value));
    const parsed = isoToDate(parseDateToIso(value));
    if (parsed) setViewDate(parsed);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
      setInputText(formatDateDisplay(value));
    };

    const handleReposition = () => updateDropdownPosition();

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updateDropdownPosition, value]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      setInputText(formatDateDisplay(value));
    };

    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [open, value]);

  const showClear = clearable && Boolean(storageValue) && !disabled;

  const commitInput = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      onChange("");
      return;
    }

    if (!isValidDateValue(trimmed)) {
      setInputText(formatDateDisplay(value));
      return;
    }

    const iso = parseDateToIso(trimmed);
    onChange(iso);
    setInputText(formatDateDisplay(iso));
  };

  const handleSelectDate = (date: Date) => {
    const iso = dateToIso(date);
    if (min && iso < min) return;
    if (max && iso > max) return;

    ignoreBlurRef.current = false;
    onChange(iso);
    setInputText(formatDateDisplay(iso));
    setViewDate(date);
    setOpen(false);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
    setInputText("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handlePanelMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    ignoreBlurRef.current = true;
  };

  const handleInputBlur = () => {
    window.setTimeout(() => {
      if (ignoreBlurRef.current) {
        ignoreBlurRef.current = false;
        return;
      }

      const active = document.activeElement;
      if (
        containerRef.current?.contains(active) ||
        dropdownRef.current?.contains(active)
      ) {
        return;
      }

      commitInput();
      setOpen(false);
    }, 0);
  };

  const openPicker = () => {
    if (disabled) return;
    updateDropdownPosition();
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const today = new Date();

  const dropdown = open && dropdownPosition && mounted ? (
    <div
      ref={dropdownRef}
      id={panelId}
      className={cn(
        "date-picker-dropdown date-picker-dropdown-portal",
        dropdownPosition.placement === "top" && "is-above",
      )}
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
      onMouseDown={handlePanelMouseDown}
    >
      <div className="date-picker-header">
        <button
          type="button"
          className="date-picker-nav"
          aria-label="Previous month"
          onClick={() =>
            setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
          }
        >
          <ChevronLeft size={16} />
        </button>

        <div className="date-picker-selects">
          <SearchableSelect
            value={String(viewDate.getMonth())}
            onChange={(nextValue) =>
              setViewDate((prev) => new Date(prev.getFullYear(), Number(nextValue), 1))
            }
            options={MONTH_NAMES.map((month, index) => ({
              value: String(index),
              label: month,
            }))}
            placeholder="Month"
            size="sm"
            clearable={false}
          />
          <SearchableSelect
            className="date-picker-year-select"
            value={String(viewDate.getFullYear())}
            onChange={(nextValue) =>
              setViewDate((prev) => new Date(Number(nextValue), prev.getMonth(), 1))
            }
            options={yearOptions.map((year) => String(year))}
            placeholder="Year"
            size="sm"
            clearable={false}
          />
        </div>

        <button
          type="button"
          className="date-picker-nav"
          aria-label="Next month"
          onClick={() =>
            setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
          }
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="date-picker-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="date-picker-weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="date-picker-grid">
        {calendarDays.map(({ date, inMonth }) => {
          const iso = dateToIso(date);
          const isDisabled = (min && iso < min) || (max && iso > max);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday = isSameDay(date, today);

          return (
            <button
              key={`${iso}-${inMonth ? "in" : "out"}`}
              type="button"
              className={cn(
                "date-picker-day",
                !inMonth && "is-other-month",
                isSelected && "is-selected",
                isToday && "is-today",
                isDisabled && "is-disabled",
              )}
              disabled={isDisabled}
              onClick={() => handleSelectDate(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="date-picker-footer">
        <button
          type="button"
          className="date-picker-quick-btn"
          onClick={() => handleSelectDate(today)}
        >
          Today
        </button>
        <button
          type="button"
          className="date-picker-quick-btn"
          onClick={() => {
            setViewDate(selectedDate ?? new Date());
          }}
        >
          Go to selected
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={cn("date-picker", open && "is-open", disabled && "is-disabled", className)}
    >
      {name ? <input type="hidden" name={name} value={storageValue} readOnly /> : null}

      <div
        ref={controlRef}
        className={cn("date-picker-control", showClear && "has-clear")}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          className="date-picker-input form-control"
          value={inputText}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={panelId}
          onFocus={openPicker}
          onChange={(event) => setInputText(formatInputMask(event.target.value))}
          onBlur={handleInputBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitInput();
              setOpen(false);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setInputText(formatDateDisplay(value));
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
        />
        <span className="date-picker-icons">
          {showClear ? (
            <button
              type="button"
              className="date-picker-clear"
              aria-label="Clear date"
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClear}
            >
              <X size={14} />
            </button>
          ) : null}
          <button
            type="button"
            className="date-picker-toggle"
            aria-label="Open calendar"
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (open) {
                setOpen(false);
                return;
              }
              openPicker();
            }}
          >
            <CalendarDays size={17} strokeWidth={1.85} />
          </button>
        </span>
      </div>

      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
