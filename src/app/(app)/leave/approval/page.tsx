"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { APPROVAL_STATS } from "@/lib/leave-stats";
import { useI18n } from "@/i18n";

export default function LeaveApprovalPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="leave-approval"
      stats={APPROVAL_STATS}
      modalSubtitle={t("leave.pages.approval.subtitle")}
      emptyStateMessage={t("leave.pages.approval.empty")}
    />
  );
}
