"use client";

import { LeaveModulePage } from "@/components/leave/LeaveModulePage";

export default function LeavePolicyPage() {
  return (
    <LeaveModulePage
      moduleId="leave-policy"
      modalSubtitle="Define rules for each leave type — notice period, limits, and eligibility."
      emptyStateMessage="Create policies to control how employees can apply for each leave type."
    />
  );
}
