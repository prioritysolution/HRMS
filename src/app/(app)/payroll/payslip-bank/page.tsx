"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { PAYSLIP_STATS } from "@/lib/payroll-stats";

export default function PayslipBankPage() {
  return (
    <MasterDataPage
      moduleId="payroll-payslip-bank"
      stats={PAYSLIP_STATS}
      modalSubtitle="Generate payslips, bank payment files, and track salary disbursements."
      emptyStateMessage="View payslips and bank transfer status for each employee payroll cycle."
    />
  );
}
