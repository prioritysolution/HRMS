"use client";

import { ModulePage } from "@/components/ui/ModulePage";
import { useI18n } from "@/i18n";

export default function Page() {
  const { t } = useI18n();

  return (
    <ModulePage
      title={t("reports.customerEngagement.title")}
      section={t("reports.section")}
      actionLabel={t("reports.customerEngagement.action")}
      columns={[
        t("reports.customerEngagement.colTouches"),
        t("reports.customerEngagement.colOwner"),
        t("reports.customerEngagement.colLastActive"),
      ]}
      stats={[
        {
          title: t("reports.customerEngagement.engagedTitle"),
          value: "94",
          change: "+9%",
          hint: t("reports.customerEngagement.engagedHint"),
          description: t("reports.customerEngagement.engagedDesc"),
          tone: "success",
          icon: "users",
        },
        {
          title: t("reports.customerEngagement.npsTitle"),
          value: "62",
          change: "+4",
          hint: t("reports.customerEngagement.npsHint"),
          description: t("reports.customerEngagement.npsDesc"),
          tone: "primary",
          icon: "trendingDown",
        },
        {
          title: t("reports.customerEngagement.silentTitle"),
          value: "17",
          change: "-2",
          hint: t("reports.customerEngagement.silentHint"),
          description: t("reports.customerEngagement.silentDesc"),
          tone: "orange",
          icon: "clock",
        },
      ]}
      rows={[
        {
          primary: "Stellar Media",
          secondary: "Growth plan",
          avatar: "/images/lead_com_logos/stellar.png",
          c1: t("reports.customerEngagement.touches", { count: 24 }),
          c2: "Sofia Reyes",
          c3: "26 Aug 2026",
          status: t("reports.customerEngagement.statusHigh"),
        },
        {
          primary: "Vestige Co",
          secondary: "Enterprise",
          avatar: "/images/lead_com_logos/vestige.png",
          c1: t("reports.customerEngagement.touches", { count: 18 }),
          c2: "Liam Brooks",
          c3: "25 Aug 2026",
          status: t("reports.customerEngagement.statusHealthy"),
        },
        {
          primary: "Quinscape",
          secondary: "Starter",
          avatar: "/images/lead_com_logos/quinscape.png",
          c1: t("reports.customerEngagement.touches", { count: 3 }),
          c2: "Ethan Park",
          c3: "08 Aug 2026",
          status: t("reports.customerEngagement.statusAtRisk"),
        },
      ]}
    />
  );
}
