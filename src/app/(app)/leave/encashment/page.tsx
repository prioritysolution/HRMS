"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function LeaveEncashmentPage() {
  return (
    <MasterDataPage
      moduleId="leave-encashment"
      modalSubtitle="Request encashment of unused eligible leave balance."
      emptyStateMessage="Submit encashment requests for leave types marked as encashable in Leave Master."
    />
  );
}
