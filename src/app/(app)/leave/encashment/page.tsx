"use client";

import { LeaveModulePage } from "@/components/leave/LeaveModulePage";

export default function LeaveEncashmentPage() {
  return (
    <LeaveModulePage
      moduleId="leave-encashment"
      modalSubtitle="Request encashment of unused eligible leave balance."
      emptyStateMessage="Submit encashment requests for leave types marked as encashable in Leave Master."
    />
  );
}
