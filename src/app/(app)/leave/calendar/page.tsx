"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function LeaveCalendarPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="leave-calendar"
      modalSubtitle={t("leave.pages.calendar.subtitle")}
      emptyStateMessage={t("leave.pages.calendar.empty")}
    />
  );
}
