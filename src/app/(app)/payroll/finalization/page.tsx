"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { FINALIZATION_STATS } from "@/lib/payroll-stats";

export default function PayrollFinalizationPage() {
  return (
    <MasterDataPage
      moduleId="payroll-finalization"
      stats={FINALIZATION_STATS}
      submitLabel="Finalize"
      modalSubtitle="Finalize payroll, generate register, and prepare bank payment file."
      emptyStateMessage="Finalize processed payroll batches and lock statutory deductions for the period."
    />
  );
}
