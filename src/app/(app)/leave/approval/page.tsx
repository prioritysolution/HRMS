"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { APPROVAL_STATS } from "@/lib/leave-stats";

export default function LeaveApprovalPage() {
  return (
    <MasterDataPage
      moduleId="leave-approval"
      stats={APPROVAL_STATS}
      modalSubtitle="Review the leave request. Use Approve or Reject in the Action column."
      emptyStateMessage="Pending leave requisitions will appear here for approval."
    />
  );
}
