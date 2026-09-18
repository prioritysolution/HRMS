"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function CheckInOutPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="check-in-out"
      modalSubtitle={t("attendance.pages.checkInOut.subtitle")}
      emptyStateMessage={t("attendance.pages.checkInOut.empty")}
    />
  );
}
