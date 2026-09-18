"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function LeaveRequisitionPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="leave-requisition"
      modalSubtitle={t("leave.pages.requisition.subtitle")}
      emptyStateMessage={t("leave.pages.requisition.empty")}
    />
  );
}
