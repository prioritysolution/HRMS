"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { APPLICATION_STATS } from "@/lib/leave-stats";
import { useI18n } from "@/i18n";

export default function LeaveApplicationPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="leave-application"
      stats={APPLICATION_STATS}
      modalSubtitle={t("leave.pages.application.subtitle")}
      emptyStateMessage={t("leave.pages.application.empty")}
    />
  );
}
