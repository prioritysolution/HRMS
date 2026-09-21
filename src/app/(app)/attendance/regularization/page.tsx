"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function RegularizationPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="regularization"
      modalSubtitle={t("attendance.pages.regularization.subtitle")}
      emptyStateMessage={t("attendance.pages.regularization.empty")}
    />
  );
}
