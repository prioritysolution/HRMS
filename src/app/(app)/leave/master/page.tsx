"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function LeaveMasterPage() {
  return (
    <MasterDataPage
      moduleId="leave-master"
      modalSubtitle="Configure leave types available for your organization."
      emptyStateMessage="Add leave types such as Casual Leave, Sick Leave, or Earned Leave."
    />
  );
}
