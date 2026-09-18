"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function OvertimePage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="overtime"
      modalSubtitle={t("attendance.pages.overtime.subtitle")}
      emptyStateMessage={t("attendance.pages.overtime.empty")}
    />
  );
}
