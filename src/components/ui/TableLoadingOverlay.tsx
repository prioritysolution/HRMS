"use client";

import { RoundLoader } from "@/components/ui/RoundLoader";
import { TABLE_LOADING_LABEL } from "@/lib/table-loading";

type TableLoadingOverlayProps = {
  label?: string;
};

export function TableLoadingOverlay({ label = TABLE_LOADING_LABEL }: TableLoadingOverlayProps) {
  return (
    <div className="table-loading-overlay" role="status" aria-live="polite" aria-label={label}>
      <RoundLoader size={54} strokeWidth={4} />
      <p className="table-loading-label">{label}</p>
    </div>
  );
}
