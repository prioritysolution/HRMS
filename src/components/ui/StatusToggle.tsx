"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

type StatusToggleProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
};

export function StatusToggle({
  id,
  name,
  value,
  onChange,
  disabled = false,
  activeLabel,
  inactiveLabel,
}: StatusToggleProps) {
  const { t } = useI18n();
  const resolvedActive = activeLabel ?? t("common.active");
  const resolvedInactive = inactiveLabel ?? t("common.inactive");
  const isActive = String(value ?? "").trim() !== "0";

  return (
    <div
      id={id}
      className={cn("status-toggle", isActive ? "is-active" : "is-inactive", disabled && "is-disabled")}
      role="group"
      aria-label={name ? `${name} status` : t("common.status")}
    >
      <span className="status-toggle-thumb" aria-hidden="true" />
      <button
        type="button"
        className="status-toggle-option"
        aria-pressed={isActive}
        disabled={disabled}
        onClick={() => onChange("1")}
      >
        {resolvedActive}
      </button>
      <button
        type="button"
        className="status-toggle-option"
        aria-pressed={!isActive}
        disabled={disabled}
        onClick={() => onChange("0")}
      >
        {resolvedInactive}
      </button>
    </div>
  );
}
