"use client";

import { LeaveModulePage } from "@/components/leave/LeaveModulePage";
import { ALLOCATION_STATS } from "@/lib/leave-stats";

export default function LeaveAllocationPage() {
  return (
    <LeaveModulePage
      moduleId="leave-allocation"
      stats={ALLOCATION_STATS}
      modalSubtitle="Allocate annual leave balance to employees by leave type."
      emptyStateMessage="Allocate leave balances for employees at the start of the year or on joining."
    />
  );
}
