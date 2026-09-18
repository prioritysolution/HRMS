"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { DASHBOARD_STATS } from "@/lib/attendance-stats";
import { useI18n } from "@/i18n";

export default function AttendanceDashboardPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="attendance-dashboard"
      stats={DASHBOARD_STATS}
      modalSubtitle={t("attendance.pages.dashboard.subtitle")}
      emptyStateMessage={t("attendance.pages.dashboard.empty")}
    />
  );
}
