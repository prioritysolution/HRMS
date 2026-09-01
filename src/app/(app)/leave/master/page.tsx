"use client";

import { LeaveModulePage } from "@/components/leave/LeaveModulePage";

export default function LeaveMasterPage() {
  return (
    <LeaveModulePage
      moduleId="leave-master"
      modalSubtitle="Configure leave types available for your organization."
      emptyStateMessage="Add leave types such as Casual Leave, Sick Leave, or Earned Leave."
    />
  );
}
