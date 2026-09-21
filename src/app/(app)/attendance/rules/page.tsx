"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function AttendanceRulesPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="attendance-rules"
      modalSubtitle={t("attendance.pages.rules.subtitle")}
      emptyStateMessage={t("attendance.pages.rules.empty")}
    />
  );
}
