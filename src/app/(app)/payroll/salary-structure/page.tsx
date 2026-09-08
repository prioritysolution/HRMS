"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function SalaryStructurePage() {
  return (
    <MasterDataPage
      moduleId="payroll-salary-structure"
      modalSubtitle="Define salary structures with earnings, deductions, and applicable statutory rule sets."
      emptyStateMessage="Create salary structures mapping components to grades, designations, or departments."
    />
  );
}
