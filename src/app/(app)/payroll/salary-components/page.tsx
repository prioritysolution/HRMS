"use client";

import { PayrollModulePage } from "@/components/payroll/PayrollModulePage";

export default function SalaryComponentsPage() {
  return (
    <PayrollModulePage
      moduleId="payroll-salary-components"
      modalSubtitle="Configure earnings and deductions. Statutory flags (PF, ESI, PT, TDS) drive payroll calculations."
      emptyStateMessage="Add salary components such as Basic, HRA, PF, ESI, and other configurable pay elements."
    />
  );
}
