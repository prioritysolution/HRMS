"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { ALLOCATION_STATS } from "@/lib/leave-stats";
import { useI18n } from "@/i18n";

export default function LeaveAllocationPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="leave-allocation"
      stats={ALLOCATION_STATS}
      modalSubtitle={t("leave.pages.allocation.subtitle")}
      emptyStateMessage={t("leave.pages.allocation.empty")}
    />
  );
}
