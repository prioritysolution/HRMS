"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function SalaryComponentsPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="payroll-salary-components"
      modalSubtitle={t("payroll.pages.salaryComponents.subtitle")}
      emptyStateMessage={t("payroll.pages.salaryComponents.empty")}
    />
  );
}
