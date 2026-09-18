"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function LeaveEntitlementPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="leave-entitlement"
      modalSubtitle={t("leave.pages.entitlement.subtitle")}
      emptyStateMessage={t("leave.pages.entitlement.empty")}
      submitLabel={t("leave.entitlementModal.submit")}
    />
  );
}
