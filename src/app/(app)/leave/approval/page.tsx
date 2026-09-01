"use client";

import { LeaveModulePage } from "@/components/leave/LeaveModulePage";
import { APPROVAL_STATS } from "@/lib/leave-stats";

export default function LeaveApprovalPage() {
  return (
    <LeaveModulePage
      moduleId="leave-approval"
      stats={APPROVAL_STATS}
      modalSubtitle="Review and approve or reject employee leave requests."
      emptyStateMessage="Pending leave applications from employees will appear here for approval."
    />
  );
}
