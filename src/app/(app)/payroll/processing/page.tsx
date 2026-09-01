"use client";

import { PayrollModulePage } from "@/components/payroll/PayrollModulePage";
import { PROCESSING_STATS } from "@/lib/payroll-stats";

export default function PayrollProcessingPage() {
  return (
    <PayrollModulePage
      moduleId="payroll-processing"
      stats={PROCESSING_STATS}
      submitLabel="Run Payroll"
      modalSubtitle="Run monthly payroll with configurable PF, ESI, PT, and TDS calculations."
      emptyStateMessage="Process monthly payroll for all employees based on attendance, leave, and salary structure."
    />
  );
}
