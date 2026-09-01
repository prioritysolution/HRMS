"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";

export default function EssServiceHistoryPage() {
  return (
    <EssModulePage
      moduleId="ess-service-history"
      emptyStateMessage="No service history records found."
    />
  );
}
