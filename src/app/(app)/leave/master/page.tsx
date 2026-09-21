"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function LeaveMasterPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="leave-master"
      modalSubtitle={t("leave.pages.master.subtitle")}
      emptyStateMessage={t("leave.pages.master.empty")}
    />
  );
}
