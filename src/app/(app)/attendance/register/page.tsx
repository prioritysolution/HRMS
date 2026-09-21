"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function AttendanceRegisterPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="attendance-register"
      modalSubtitle={t("attendance.pages.register.subtitle")}
      emptyStateMessage={t("attendance.pages.register.empty")}
    />
  );
}
