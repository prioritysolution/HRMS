"use client";

import { ModulePage } from "@/components/ui/ModulePage";
import { useI18n } from "@/i18n";

export default function Page() {
  const { t } = useI18n();

  return (
    <ModulePage
      title={t("reports.employeePerformance.title")}
      section={t("reports.section")}
      actionLabel={t("reports.employeePerformance.action")}
      columns={[
        t("reports.employeePerformance.colDepartment"),
        t("reports.employeePerformance.colScore"),
        t("reports.employeePerformance.colPeriod"),
      ]}
      stats={[
        {
          title: t("reports.employeePerformance.avgTitle"),
          value: "4.1",
          change: "+0.2",
          hint: t("reports.employeePerformance.avgHint"),
          description: t("reports.employeePerformance.avgDesc"),
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: t("reports.employeePerformance.reviewedTitle"),
          value: "162",
          change: "78%",
          hint: t("reports.employeePerformance.reviewedHint"),
          description: t("reports.employeePerformance.reviewedDesc"),
          tone: "primary",
          icon: "users",
        },
        {
          title: t("reports.employeePerformance.focusTitle"),
          value: "14",
          change: "-3",
          hint: t("reports.employeePerformance.focusHint"),
          description: t("reports.employeePerformance.focusDesc"),
          tone: "warning",
          icon: "briefcase",
        },
      ]}
      rows={[
        {
          primary: "Priya Sharma",
          secondary: "Engineering Lead",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Engineering",
          c2: "4.7",
          c3: "Q3 2026",
          status: t("reports.employeePerformance.statusExcellent"),
        },
        {
          primary: "Sofia Reyes",
          secondary: "Account Executive",
          avatar: "/images/avatars/avatar8.jpg",
          c1: "Sales",
          c2: "4.3",
          c3: "Q3 2026",
          status: t("reports.employeePerformance.statusGood"),
        },
        {
          primary: "Noah Blake",
          secondary: "Backend Engineer",
          avatar: "/images/avatars/avatar6.jpg",
          c1: "Engineering",
          c2: "3.5",
          c3: "Q3 2026",
          status: t("reports.employeePerformance.statusReview"),
        },
      ]}
    />
  );
}
