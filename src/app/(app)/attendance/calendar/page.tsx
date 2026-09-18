"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function AttendanceCalendarPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="attendance-calendar"
      modalSubtitle={t("attendance.pages.calendar.subtitle")}
      emptyStateMessage={t("attendance.pages.calendar.empty")}
    />
  );
}
