"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { APPROVAL_STATS } from "@/lib/leave-stats";

export default function LeaveApprovalPage() {
  return (
    <MasterDataPage
      moduleId="leave-approval"
      stats={APPROVAL_STATS}
      modalSubtitle="Review pending leave requests. Approve or reject from the Action column."
      emptyStateMessage="No pending leave applications in the approval queue."
    />
  );
}
