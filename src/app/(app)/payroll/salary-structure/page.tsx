"use client";

import { PayrollModulePage } from "@/components/payroll/PayrollModulePage";

export default function SalaryStructurePage() {
  return (
    <PayrollModulePage
      moduleId="payroll-salary-structure"
      modalSubtitle="Define salary structures with earnings, deductions, and applicable statutory rule sets."
      emptyStateMessage="Create salary structures mapping components to grades, designations, or departments."
    />
  );
}
