"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { REVISION_STATS } from "@/lib/payroll-stats";

export default function SalaryRevisionPage() {
  return (
    <MasterDataPage
      moduleId="payroll-salary-revision"
      stats={REVISION_STATS}
      modalSubtitle="Record salary revisions, increments, promotions, and full & final settlements."
      emptyStateMessage="Track employee salary revisions with effective dates and approval workflow."
    />
  );
}
