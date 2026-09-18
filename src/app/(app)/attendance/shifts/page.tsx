"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function AttendanceShiftsPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="attendance-shifts"
      modalSubtitle={t("attendance.pages.shifts.subtitle")}
      emptyStateMessage={t("attendance.pages.shifts.empty")}
    />
  );
}
