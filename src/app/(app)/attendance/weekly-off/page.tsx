"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function WeeklyOffPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="weekly-off"
      modalSubtitle={t("attendance.pages.weeklyOff.subtitle")}
      emptyStateMessage={t("attendance.pages.weeklyOff.empty")}
    />
  );
}
