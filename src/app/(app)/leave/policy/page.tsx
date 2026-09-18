"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function LeavePolicyPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="leave-policy"
      modalSubtitle={t("leave.pages.policy.subtitle")}
      emptyStateMessage={t("leave.pages.policy.empty")}
    />
  );
}
