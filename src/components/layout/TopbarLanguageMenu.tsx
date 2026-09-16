"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Globe } from "lucide-react";

export type AppLanguage = "en" | "bn" | "hi" | "or";

const LANGUAGE_STORAGE_KEY = "priohrm-language";

const LANGUAGE_OPTIONS: Array<{
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  shortLabel: string;
}> = [
  { code: "en", label: "English", nativeLabel: "English", shortLabel: "EN" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", shortLabel: "BN" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", shortLabel: "HI" },
  { code: "or", label: "Odia", nativeLabel: "ଓଡ଼ିଆ", shortLabel: "OR" },
];

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === "en" || value === "bn" || value === "hi" || value === "or";
}

function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isAppLanguage(saved) ? saved : "en";
}

function applyDocumentLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
  document.documentElement.setAttribute("data-language", language);
}

export function TopbarLanguageMenu() {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = readStoredLanguage();
    setLanguage(saved);
    applyDocumentLanguage(saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const root = document.getElementById("topbar-language-menu");
      if (root && !root.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selectLanguage = useCallback((next: AppLanguage) => {
    setLanguage(next);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    applyDocumentLanguage(next);
    setOpen(false);
  }, []);

  const current =
    LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <div id="topbar-language-menu" className="relative">
      <button
        type="button"
        className={`topbar-language-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={`Language: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={current.label}
      >
        <Globe size={15} aria-hidden="true" />
        <span className="topbar-language-trigger-text">
          <strong>{current.shortLabel}</strong>
          <small className="topbar-language-trigger-name">{current.label}</small>
        </span>
        <span className="topbar-language-trigger-caret" aria-hidden="true" />
      </button>

      {open ? (
        <div className="dropdown-panel topbar-language-panel" role="menu">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h5 className="m-0 text-sm font-semibold">Language</h5>
            <p className="m-0 text-xs text-muted">Choose your preferred language</p>
          </div>
          <div className="py-1">
            {LANGUAGE_OPTIONS.map((option) => {
              const active = option.code === language;
              return (
                <button
                  key={option.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  className={`topbar-language-option${active ? " is-active" : ""}`}
                  onClick={() => selectLanguage(option.code)}
                >
                  <span>
                    <strong>
                      {option.nativeLabel}
                      <em>{option.shortLabel}</em>
                    </strong>
                    <small>{option.label}</small>
                  </span>
                  {active ? <Check size={15} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
