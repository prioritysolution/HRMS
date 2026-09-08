"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function SalaryComponentsPage() {
  return (
    <MasterDataPage
      moduleId="payroll-salary-components"
      modalSubtitle="Configure earnings and deductions. Statutory flags (PF, ESI, PT, TDS) drive payroll calculations."
      emptyStateMessage="Add salary components such as Basic, HRA, PF, ESI, and other configurable pay elements."
    />
  );
}
