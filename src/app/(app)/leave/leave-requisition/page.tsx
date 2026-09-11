"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function LeaveRequisitionPage() {
  return (
    <MasterDataPage
      moduleId="leave-requisition"
      modalSubtitle="Apply for leave. New applications are saved as Pending."
      emptyStateMessage="No leave requisitions yet. Apply with leave type, dates, and reason."
    />
  );
}
