"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
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
  const seen = new Set<string>();
  const result: SearchableSelectOption[] = [];
  for (const option of options) {
    const item = typeof option === "string" ? { value: option, label: option } : option;
    if (!item) continue;
    const key = String(item.value ?? item.label ?? "");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
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
  const optionsListRef = useRef<HTMLUListElement>(null);
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [maxMenuHeight, setMaxMenuHeight] = useState<number>(220);

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

  // Smart placement calculation: auto-flip when near bottom of viewport or modal
  const updatePlacement = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const modalBody = containerRef.current.closest(".modal-body") as HTMLElement | null;

    let spaceBelow = window.innerHeight - rect.bottom - 16;
    let spaceAbove = rect.top - 16;

    if (modalBody) {
      const modalRect = modalBody.getBoundingClientRect();
      spaceBelow = Math.min(spaceBelow, modalRect.bottom - rect.bottom - 16);
      spaceAbove = Math.min(spaceAbove, rect.top - modalRect.top - 16);
    }

    if (spaceBelow < 210 && spaceAbove > spaceBelow) {
      setPlacement("top");
      setMaxMenuHeight(Math.max(120, Math.min(240, Math.floor(spaceAbove))));
    } else {
      setPlacement("bottom");
      setMaxMenuHeight(Math.max(120, Math.min(240, Math.floor(spaceBelow))));
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePlacement();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
        setHighlightIndex(0);
      }
    };

    const handleScrollOrResize = () => {
      updatePlacement();
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    const scrollParent = containerRef.current?.closest(".modal-body") || window;
    scrollParent.addEventListener("scroll", handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleScrollOrResize);
      scrollParent.removeEventListener("scroll", handleScrollOrResize);
    };
  }, [open, updatePlacement]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  // Keep highlighted item in view during keyboard navigation
  useEffect(() => {
    if (!open || !optionsListRef.current) return;
    const highlightedEl = optionsListRef.current.children[highlightIndex] as HTMLElement | undefined;
    if (highlightedEl && typeof highlightedEl.scrollIntoView === "function") {
      highlightedEl.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, open]);

  const handleSelect = (nextValue: string) => {
    const newValues = [...selectedValues, nextValue];
    onChange(newValues.join(","));
    setQuery("");
    setHighlightIndex(0);
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
    updatePlacement();
    setOpen(true);
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        setQuery("");
        setHighlightIndex(0);
      }
    }, 140);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    if (!open) {
      updatePlacement();
      setOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !query && selectedValues.length > 0) {
      handleRemove(selectedValues[selectedValues.length - 1]);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        updatePlacement();
        setOpen(true);
      }
      setHighlightIndex((prev) => Math.min(prev + 1, Math.max(listOptions.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        updatePlacement();
        setOpen(true);
      }
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
    updatePlacement();
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "searchable-select",
        `placement-${placement}`,
        open && "is-open",
        disabled && "is-disabled",
        className,
      )}
    >
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      <div 
        className={cn(
          "searchable-select-control form-control h-auto min-h-[42px] flex flex-wrap gap-1.5 items-center px-3 py-1.5 cursor-text",
          className,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedOptions.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--card-soft)] text-[var(--title)] rounded-md text-xs font-semibold border border-[var(--border)] shadow-xs"
          >
            {opt.label}
            <button
              type="button"
              onClick={(e) => handleRemove(opt.value, e)}
              className="hover:bg-danger-soft hover:text-danger rounded text-muted transition-colors p-0.5"
              aria-label={`Remove ${opt.label}`}
            >
              <X size={12} strokeWidth={2.5} />
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

      {open ? (
        <div className="searchable-select-dropdown">
          <ul
            ref={optionsListRef}
            id={listId}
            className="searchable-select-options"
            role="listbox"
            style={{ maxHeight: `${maxMenuHeight}px` }}
          >
            {listOptions.map((option, index) => (
              <li
                key={`${option.value}-${index}`}
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
                <span className="searchable-select-option-label">{option.label}</span>
              </li>
            ))}
            {listOptions.length === 0 ? (
              <li className="searchable-select-empty">
                <Search size={14} className="searchable-select-empty-icon" />
                <span>{query ? "No matching options" : "All options selected"}</span>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
