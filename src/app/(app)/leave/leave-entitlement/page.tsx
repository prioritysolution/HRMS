"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function LeaveEntitlementPage() {
  return (
    <MasterDataPage
      moduleId="leave-entitlement"
      modalSubtitle="Set allocated days by leave type for a financial year."
      emptyStateMessage="Add entitlement to set leave allocation for a financial year."
      submitLabel="Save Entitlement"
    />
  );
}
