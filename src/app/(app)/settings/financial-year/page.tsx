"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function FinancialYearPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="financial-year"
      modalSubtitle={t("settings.financialYear.subtitle")}
      emptyStateMessage={t("settings.financialYear.empty")}
    />
  );
}
