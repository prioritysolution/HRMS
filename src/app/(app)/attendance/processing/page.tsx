"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { PROCESSING_STATS } from "@/lib/attendance-stats";
import { useI18n } from "@/i18n";

export default function AttendanceProcessingPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="attendance-processing"
      stats={PROCESSING_STATS}
      modalSubtitle={t("attendance.pages.processing.subtitle")}
      emptyStateMessage={t("attendance.pages.processing.empty")}
    />
  );
}
