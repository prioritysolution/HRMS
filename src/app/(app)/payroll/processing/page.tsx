"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { PROCESSING_STATS } from "@/lib/payroll-stats";

export default function PayrollProcessingPage() {
  return (
    <MasterDataPage
      moduleId="payroll-processing"
      stats={PROCESSING_STATS}
      submitLabel="Run Payroll"
      modalSubtitle="Run monthly payroll with configurable PF, ESI, PT, and TDS calculations."
      emptyStateMessage="Process monthly payroll for all employees based on attendance, leave, and salary structure."
    />
  );
}
