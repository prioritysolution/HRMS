"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { PAYSLIP_STATS } from "@/lib/payroll-stats";
import { useI18n } from "@/i18n";

export default function PayslipBankPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="payroll-payslip-bank"
      stats={PAYSLIP_STATS}
      modalSubtitle={t("payroll.pages.payslipBank.subtitle")}
      emptyStateMessage={t("payroll.pages.payslipBank.empty")}
    />
  );
}
