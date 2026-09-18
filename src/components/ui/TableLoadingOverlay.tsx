"use client";

import { RoundLoader } from "@/components/ui/RoundLoader";
import { useI18n } from "@/i18n";

type TableLoadingOverlayProps = {
  label?: string;
};

export function TableLoadingOverlay({ label }: TableLoadingOverlayProps) {
  const { t } = useI18n();
  const resolved = label ?? t("common.table.loadingRows");

  return (
    <div className="table-loading-overlay" role="status" aria-live="polite" aria-label={resolved}>
      <RoundLoader size={54} strokeWidth={4} />
      <p className="table-loading-label">{resolved}</p>
    </div>
  );
}
