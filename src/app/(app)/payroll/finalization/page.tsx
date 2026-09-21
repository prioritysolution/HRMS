"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { FINALIZATION_STATS } from "@/lib/payroll-stats";
import { useI18n } from "@/i18n";

export default function PayrollFinalizationPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="payroll-finalization"
      stats={FINALIZATION_STATS}
      submitLabel={t("payroll.pages.finalization.submit")}
      modalSubtitle={t("payroll.pages.finalization.subtitle")}
      emptyStateMessage={t("payroll.pages.finalization.empty")}
    />
  );
}
