"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function LeaveCalendarPage() {
  return (
    <MasterDataPage
      moduleId="leave-calendar"
      modalSubtitle="View approved and planned leave across the organization by month."
      emptyStateMessage="Leave calendar entries will show who is on leave and when."
    />
  );
}
