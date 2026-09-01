"use client";

import { LeaveModulePage } from "@/components/leave/LeaveModulePage";

export default function LeaveCalendarPage() {
  return (
    <LeaveModulePage
      moduleId="leave-calendar"
      modalSubtitle="View approved and planned leave across the organization by month."
      emptyStateMessage="Leave calendar entries will show who is on leave and when."
    />
  );
}
