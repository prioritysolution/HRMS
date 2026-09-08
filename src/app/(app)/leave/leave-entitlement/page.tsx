"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function LeaveEntitlementPage() {
  return (
    <MasterDataPage
      moduleId="leave-entitlement"
      modalSubtitle="Set leave allocation by financial year. Demo data is used until the leave entitlement API is connected."
      emptyStateMessage="Add entitlement with a financial year, leave type, and allocation."
    />
  );
}
