"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { SOURCES_STATS } from "@/lib/attendance-stats";
import { useI18n } from "@/i18n";

export default function AttendanceSourcesPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="attendance-sources"
      stats={SOURCES_STATS}
      modalSubtitle={t("attendance.pages.sources.subtitle")}
      emptyStateMessage={t("attendance.pages.sources.empty")}
    />
  );
}
