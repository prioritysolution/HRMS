"use client";

import { RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n";

type ResetButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

export function ResetButton({ onClick, label, className }: ResetButtonProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      className={["btn-reset-light", className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      <RotateCcw size={14} strokeWidth={2.25} />
      {label ?? t("common.reset")}
    </button>
  );
}
