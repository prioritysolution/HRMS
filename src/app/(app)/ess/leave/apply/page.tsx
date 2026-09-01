"use client";

import { EssModulePage } from "@/components/ess/EssModulePage";

export default function EssApplyLeavePage() {
  return (
    <EssModulePage
      moduleId="ess-leave-apply"
      allowAdd
      modalSubtitle="Submit a leave request. Your manager will review and approve it."
      emptyStateMessage="You haven't applied for leave yet. Click 'Add New' to submit your first application."
    />
  );
}
