"use client";

import { ModulePage } from "@/components/ui/ModulePage";
import { useI18n } from "@/i18n";

export default function Page() {
  const { t } = useI18n();

  return (
    <ModulePage
      title={t("reports.kpi.title")}
      section={t("reports.section")}
      actionLabel={t("reports.kpi.action")}
      columns={[
        t("reports.kpi.colTarget"),
        t("reports.kpi.colActual"),
        t("reports.kpi.colOwner"),
      ]}
      stats={[
        {
          title: t("reports.kpi.revenueTitle"),
          value: "108%",
          change: "+8%",
          hint: t("reports.kpi.revenueHint"),
          description: t("reports.kpi.revenueDesc"),
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: t("reports.kpi.hiringTitle"),
          value: "86%",
          change: "-4%",
          hint: t("reports.kpi.hiringHint"),
          description: t("reports.kpi.hiringDesc"),
          tone: "warning",
          icon: "userPlus",
          positive: false,
        },
        {
          title: t("reports.kpi.retentionTitle"),
          value: "97%",
          change: "+1%",
          hint: t("reports.kpi.retentionHint"),
          description: t("reports.kpi.retentionDesc"),
          tone: "primary",
          icon: "users",
        },
      ]}
      rows={[
        {
          primary: t("reports.kpi.rowMrr"),
          secondary: t("reports.kpi.rowMrrSecondary"),
          avatar: "/images/avatars/avatar1.jpg",
          c1: "$400k",
          c2: "$432k",
          c3: t("reports.kpi.rowMrrOwner"),
          status: t("reports.kpi.statusMet"),
        },
        {
          primary: t("reports.kpi.rowHire"),
          secondary: t("reports.kpi.rowHireSecondary"),
          avatar: "/images/avatars/avatar2.jpg",
          c1: "28 days",
          c2: "34 days",
          c3: t("reports.kpi.rowHireOwner"),
          status: t("reports.kpi.statusBehind"),
        },
        {
          primary: t("reports.kpi.rowRetention"),
          secondary: t("reports.kpi.rowRetentionSecondary"),
          avatar: "/images/avatars/avatar3.jpg",
          c1: "95%",
          c2: "96%",
          c3: t("reports.kpi.rowRetentionOwner"),
          status: t("reports.kpi.statusMet"),
        },
      ]}
    />
  );
}
