"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
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
  const optionsListRef = useRef<HTMLUListElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [maxMenuHeight, setMaxMenuHeight] = useState<number>(220);

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

    // Default dropdown height is ~210px. If space below is constrained and space above is greater:
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
    updatePlacement();
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
    updatePlacement();
    setOpen(true);
    inputRef.current?.focus();
  };

  const showClear = clearable && Boolean(value) && !disabled;
  const inputValue = open ? query : closedDisplay;

  return (
    <div
      ref={containerRef}
      className={cn(
        "searchable-select",
        `placement-${placement}`,
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
              <X size={13} strokeWidth={2.5} />
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
          <ul
            ref={optionsListRef}
            id={listId}
            className="searchable-select-options"
            role="listbox"
            style={{ maxHeight: `${maxMenuHeight}px` }}
          >
            {listOptions.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={`${option.value || `empty-${option.label}`}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "searchable-select-option",
                    isSelected && "is-selected",
                    index === highlightIndex && "is-highlighted",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="searchable-select-option-label">{option.label}</span>
                  {isSelected ? (
                    <Check size={14} strokeWidth={2.5} className="searchable-select-check" />
                  ) : null}
                </li>
              );
            })}
            {listOptions.length === 0 ? (
              <li className="searchable-select-empty">
                <Search size={14} className="searchable-select-empty-icon" />
                <span>No options found</span>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
