"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";

export default function EssHolidaysPage() {
  return (
    <EssModulePage
      moduleId="ess-holidays"
      emptyStateMessage="No holidays configured for this year."
    />
  );
}
