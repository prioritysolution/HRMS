"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { REVISION_STATS } from "@/lib/payroll-stats";
import { useI18n } from "@/i18n";

export default function SalaryRevisionPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="payroll-salary-revision"
      stats={REVISION_STATS}
      modalSubtitle={t("payroll.pages.salaryRevision.subtitle")}
      emptyStateMessage={t("payroll.pages.salaryRevision.empty")}
    />
  );
}
