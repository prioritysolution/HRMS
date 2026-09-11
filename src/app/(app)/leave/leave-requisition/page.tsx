"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function LeaveRequisitionPage() {
  return (
    <MasterDataPage
      moduleId="leave-requisition"
      modalSubtitle="Create a leave requisition for a branch and employee. New applications are saved as Pending."
      emptyStateMessage="Add a requisition with branch, employee, leave type, dates, and reason."
    />
  );
}
