"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchableSelectOption } from "./SearchableSelect";

type MultiSelectProps = {
  id?: string;
  name?: string;
  value: string; // comma-separated values
  onChange: (value: string) => void;
  options: Array<string | SearchableSelectOption>;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
};

function normalizeOptions(options: Array<string | SearchableSelectOption>): SearchableSelectOption[] {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
}

export function MultiSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
}: MultiSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  const selectedValues = useMemo(() => {
    return value ? value.split(",").map(v => v.trim()).filter(Boolean) : [];
  }, [value]);

  const selectedOptions = useMemo(() => {
    return selectedValues.map(val => {
      const found = normalizedOptions.find(opt => opt.value === val);
      return found || { value: val, label: val };
    });
  }, [selectedValues, normalizedOptions]);

  const listOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    return normalizedOptions.filter((option) => {
      // Exclude already selected
      if (selectedValues.includes(option.value)) return false;
      // Filter by query
      if (term && !option.label.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [normalizedOptions, query, selectedValues]);

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
    const newValues = [...selectedValues, nextValue];
    onChange(newValues.join(","));
    setQuery("");
    setHighlightIndex(0);
    // Keep open for multiple selections
    inputRef.current?.focus();
  };

  const handleRemove = (valToRemove: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (disabled) return;
    const newValues = selectedValues.filter(v => v !== valToRemove);
    onChange(newValues.join(","));
  };

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
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
    if (event.key === "Backspace" && !query && selectedValues.length > 0) {
      // Remove last tag on backspace if input is empty
      handleRemove(selectedValues[selectedValues.length - 1]);
      return;
    }

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
      if (open && listOptions.length > 0) {
        const option = listOptions[highlightIndex];
        if (option) handleSelect(option.value);
      }
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "searchable-select", // Reuse searchable-select styles
        open && "is-open",
        disabled && "is-disabled",
        className,
      )}
    >
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      <div 
        className={cn("searchable-select-control form-control h-auto min-h-[42px] flex flex-wrap gap-1 items-center px-3 py-1.5", className)}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedOptions.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--info-soft)] text-[var(--info)] rounded-md text-sm font-medium border border-[var(--info-soft)]"
          >
            {opt.label}
            <button
              type="button"
              onClick={(e) => handleRemove(opt.value, e)}
              className="hover:bg-black/5 rounded text-[var(--info)] transition-colors p-0.5"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        
        <div className="flex-1 min-w-[120px] flex items-center">
          <input
            ref={inputRef}
            id={id}
            type="text"
            className="bg-transparent border-none outline-none w-full text-sm text-[var(--hrms-text-primary)] placeholder-[var(--hrms-text-tertiary)]"
            value={query}
            placeholder={selectedValues.length === 0 ? placeholder : searchPlaceholder}
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
        </div>
        
        <span className="searchable-select-icons shrink-0">
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

      {open && listOptions.length > 0 ? (
        <div className="searchable-select-dropdown">
          <ul id={listId} className="searchable-select-options" role="listbox">
            {listOptions.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={false}
                className={cn(
                  "searchable-select-option",
                  index === highlightIndex && "is-highlighted",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      ) : open && query ? (
        <div className="searchable-select-dropdown">
          <ul className="searchable-select-options">
            <li className="searchable-select-empty">No options found</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
