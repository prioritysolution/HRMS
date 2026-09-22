"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useI18n } from "@/i18n";

export function LoginLanguageSelect() {
  const { language, setLanguage, options, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const current = options.find((option) => option.code === language) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="login-field login-language-field" ref={rootRef}>
      <div className={`login-input-wrap login-language-wrap${open ? " is-open" : ""}`}>
        <Globe size={21} strokeWidth={2} aria-hidden="true" />

        <button
          type="button"
          id="authLanguage"
          className="login-language-trigger"
          aria-label={t("topbar.language")}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="login-language-value">
            <span className="login-language-badge">{current.shortLabel}</span>
            <span className="login-language-label">{current.nativeLabel}</span>
          </span>

          <ChevronDown
            size={18}
            strokeWidth={2}
            className={`login-language-chevron${open ? " is-open" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {open ? (
        <div
          id={listId}
          className="login-language-panel"
          role="listbox"
          aria-label={t("topbar.language")}
        >
          {options.map((option) => {
            const active = option.code === language;

            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={active}
                className={`login-language-option${active ? " is-active" : ""}`}
                onClick={() => {
                  setLanguage(option.code);
                  setOpen(false);
                }}
              >
                <span className="login-language-option-main">
                  <span
                    className={`login-language-opt-badge${active ? " is-active" : ""}`}
                  >
                    {option.shortLabel}
                  </span>
                  <span className="login-language-option-text">
                    <span className="login-language-option-native">
                      {option.nativeLabel}
                    </span>
                    {option.nativeLabel !== option.label ? (
                      <span className="login-language-option-en">
                        {option.label}
                      </span>
                    ) : null}
                  </span>
                </span>

                {active ? (
                  <span className="login-language-check" aria-hidden="true">
                    <Check size={14} strokeWidth={2.5} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
