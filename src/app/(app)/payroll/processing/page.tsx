"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { PROCESSING_STATS } from "@/lib/payroll-stats";
import { useI18n } from "@/i18n";

export default function PayrollProcessingPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="payroll-processing"
      stats={PROCESSING_STATS}
      submitLabel={t("payroll.pages.processing.submit")}
      modalSubtitle={t("payroll.pages.processing.subtitle")}
      emptyStateMessage={t("payroll.pages.processing.empty")}
    />
  );
}
