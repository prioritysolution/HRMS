"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function LeavePolicyPage() {
  return (
    <MasterDataPage
      moduleId="leave-policy"
      modalSubtitle="Define rules for each leave type — notice period, limits, and eligibility."
      emptyStateMessage="Create policies to control how employees can apply for each leave type."
    />
  );
}
