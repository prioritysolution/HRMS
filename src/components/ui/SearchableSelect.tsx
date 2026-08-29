"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | SearchableSelectOption>;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  allowEmpty?: boolean;
  emptyLabel?: string;
  clearable?: boolean;
};

function normalizeOptions(options: Array<string | SearchableSelectOption>): SearchableSelectOption[] {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
}

export function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select option",
  disabled = false,
  className,
  size = "md",
  allowEmpty = false,
  emptyLabel = "All",
  clearable = true,
}: SearchableSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => option.value === value),
    [normalizedOptions, value],
  );

  const listOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? normalizedOptions.filter((option) => option.label.toLowerCase().includes(term))
      : normalizedOptions;

    if (allowEmpty) {
      return [{ value: "", label: emptyLabel }, ...filtered];
    }

    return filtered;
  }, [normalizedOptions, query, allowEmpty, emptyLabel]);

  const closedDisplay = selectedOption?.label ?? (allowEmpty && !value ? emptyLabel : "");

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
        setHighlightIndex(0);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
    setHighlightIndex(0);
    inputRef.current?.blur();
  };

  const handleClear = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        setQuery("");
        setHighlightIndex(0);
      }
    }, 120);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      setHighlightIndex((prev) => Math.min(prev + 1, Math.max(listOptions.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = listOptions[highlightIndex];
      if (option) handleSelect(option.value);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
      return;
    }
    inputRef.current?.focus();
  };

  const showClear = clearable && Boolean(value) && !disabled;

  const inputValue = open ? query : closedDisplay;

  return (
    <div
      ref={containerRef}
      className={cn(
        "searchable-select",
        size === "sm" && "searchable-select-sm",
        open && "is-open",
        disabled && "is-disabled",
        className,
      )}
    >
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      <div className={cn("searchable-select-control", showClear && "has-clear")}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="searchable-select-input form-control"
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <span className="searchable-select-icons">
          {showClear ? (
            <button
              type="button"
              className="searchable-select-clear"
              aria-label="Clear selection"
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClear}
            >
              <X size={14} />
            </button>
          ) : null}
          <button
            type="button"
            className="searchable-select-toggle"
            aria-label={open ? "Close options" : "Open options"}
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggleOpen}
          >
            <ChevronDown size={16} className="searchable-select-chevron" />
          </button>
        </span>
      </div>

      {open ? (
        <div className="searchable-select-dropdown">
          <ul id={listId} className="searchable-select-options" role="listbox">
            {listOptions.map((option, index) => (
              <li
                key={option.value || `empty-${option.label}`}
                role="option"
                aria-selected={option.value === value}
                className={cn(
                  "searchable-select-option",
                  option.value === value && "is-selected",
                  index === highlightIndex && "is-highlighted",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))}
            {listOptions.length === 0 ? (
              <li className="searchable-select-empty">No options found</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
