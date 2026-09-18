"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function MissingPunchPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="missing-punch"
      modalSubtitle={t("attendance.pages.missingPunch.subtitle")}
      emptyStateMessage={t("attendance.pages.missingPunch.empty")}
    />
  );
}
