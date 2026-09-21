"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function OnDutyPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="on-duty"
      modalSubtitle={t("attendance.pages.onDuty.subtitle")}
      emptyStateMessage={t("attendance.pages.onDuty.empty")}
    />
  );
}
