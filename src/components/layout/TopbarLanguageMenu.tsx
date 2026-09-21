"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Globe, ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n";

export function TopbarLanguageMenu() {
  const { language, setLanguage, options, t } = useI18n();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (!open) return;

    function adjustPosition() {
      const el = panelRef.current;
      const root = document.getElementById("topbar-language-menu");
      if (!el || !root) return;

      const parentRect = root.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const padding = 12;
      const panelWidth = el.offsetWidth || 245;

      // On desktop, default align to left of button. On small screens (<=768px), default align to right of button.
      let targetLeft = parentRect.left;
      if (viewportWidth <= 768) {
        targetLeft = parentRect.right - panelWidth;
      }

      // Clamp within viewport margins
      const maxLeft = viewportWidth - panelWidth - padding;
      const minLeft = padding;
      const clampedLeft = Math.max(minLeft, Math.min(targetLeft, maxLeft));

      // Calculate left offset relative to root container
      const relativeLeft = clampedLeft - parentRect.left;

      el.style.left = `${relativeLeft}px`;
      el.style.right = "auto";
    }

    adjustPosition();
    const rafId = requestAnimationFrame(adjustPosition);
    window.addEventListener("resize", adjustPosition);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", adjustPosition);
    };
  }, [open]);

  const current = options.find((option) => option.code === language) ?? options[0];

  return (
    <div id="topbar-language-menu" className="relative">
      <button
        type="button"
        className={`topbar-language-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={`${t("topbar.language")}: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={current.label}
      >
        <Globe className="topbar-language-globe-icon" size={15} aria-hidden="true" />
        <span className="topbar-language-current-label">
          <span className="topbar-language-badge">{current.shortLabel}</span>
          <span className="topbar-language-native">{current.nativeLabel}</span>
        </span>
        <ChevronDown
          size={14}
          className={`topbar-language-chevron${open ? " is-open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div ref={panelRef} className="topbar-language-panel" role="menu">
          <div className="topbar-language-panel-header">
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-primary" />
              <h5 className="m-0 text-sm font-semibold text-[var(--title)]">
                {t("topbar.language")}
              </h5>
            </div>
            <p className="m-0 text-xs text-[var(--muted)] mt-0.5">
              {t("topbar.languageHint")}
            </p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {options.map((option) => {
              const active = option.code === language;
              return (
                <button
                  key={option.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  className={`topbar-language-option${active ? " is-active" : ""}`}
                  onClick={() => {
                    setLanguage(option.code);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`topbar-language-opt-badge${active ? " is-active" : ""}`}>
                      {option.shortLabel}
                    </span>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-sm font-semibold text-[var(--title)] leading-tight">
                        {option.nativeLabel}
                      </span>
                      {option.nativeLabel !== option.label && (
                        <span className="text-[11px] text-[var(--muted)] leading-tight mt-0.5">
                          {option.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {active ? (
                    <div className="topbar-language-check-wrapper">
                      <Check size={13} strokeWidth={2.5} />
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

