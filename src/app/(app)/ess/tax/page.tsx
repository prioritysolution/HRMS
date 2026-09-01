"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";

export default function EssTaxPage() {
  return (
    <EssModulePage
      moduleId="ess-tax"
      emptyStateMessage="No tax records found for your account."
    />
  );
}
