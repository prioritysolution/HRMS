"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function SalaryStructurePage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="payroll-salary-structure"
      modalSubtitle={t("payroll.pages.salaryStructure.subtitle")}
      emptyStateMessage={t("payroll.pages.salaryStructure.empty")}
    />
  );
}
