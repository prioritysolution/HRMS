"use client";

import { PayrollModulePage } from "@/components/payroll/PayrollModulePage";
import { FINALIZATION_STATS } from "@/lib/payroll-stats";

export default function PayrollFinalizationPage() {
  return (
    <PayrollModulePage
      moduleId="payroll-finalization"
      stats={FINALIZATION_STATS}
      submitLabel="Finalize"
      modalSubtitle="Finalize payroll, generate register, and prepare bank payment file."
      emptyStateMessage="Finalize processed payroll batches and lock statutory deductions for the period."
    />
  );
}
