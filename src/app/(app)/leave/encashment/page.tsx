"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function LeaveEncashmentPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="leave-encashment"
      modalSubtitle={t("leave.pages.encashment.subtitle")}
      emptyStateMessage={t("leave.pages.encashment.empty")}
    />
  );
}
