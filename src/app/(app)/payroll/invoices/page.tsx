"use client";

import { ModulePage } from "@/components/ui/ModulePage";
import { useI18n, translateModuleStat } from "@/i18n";

export default function Page() {
  const { language, t } = useI18n();

  const stats = [
    {
      title: "Outstanding",
      value: "$86k",
      change: "+7%",
      hint: "month",
      description: "Unpaid invoice balance",
      tone: "warning" as const,
      icon: "briefcase" as const,
    },
    {
      title: "Collected",
      value: "$214k",
      change: "+12%",
      hint: "month",
      description: "Payments received",
      tone: "success" as const,
      icon: "trendingDown" as const,
    },
    {
      title: "Overdue",
      value: "5",
      change: "-1",
      hint: "week",
      description: "Invoices past due date",
      tone: "danger" as const,
      icon: "calendar" as const,
      positive: false,
    },
  ].map((stat) => {
    const key = stat.title;
    return {
      ...stat,
      title: translateModuleStat(language, key, "title", key),
      hint: translateModuleStat(language, key, "hint", stat.hint),
      description: translateModuleStat(language, key, "description", stat.description),
    };
  });

  return (
    <ModulePage
      title={t("payroll.pages.invoices.title")}
      section={t("payroll.pages.invoices.section")}
      actionLabel={t("payroll.pages.invoices.action")}
      columns={[
        t("payroll.pages.invoices.columns.client"),
        t("payroll.pages.invoices.columns.amount"),
        t("payroll.pages.invoices.columns.due"),
      ]}
      stats={stats}
      rows={[
        {
          primary: "INV-2048",
          secondary: "Annual license",
          avatar: "/images/lead_com_logos/vestige.png",
          c1: "Vestige Co",
          c2: "$12,800",
          c3: "05 Sep 2026",
          status: "Sent",
        },
        {
          primary: "INV-2051",
          secondary: "Seat expansion",
          avatar: "/images/lead_com_logos/stellar.png",
          c1: "Stellar Media",
          c2: "$4,200",
          c3: "01 Sep 2026",
          status: "Paid",
        },
        {
          primary: "INV-2054",
          secondary: "Professional services",
          avatar: "/images/lead_com_logos/atom.png",
          c1: "Atom Soft",
          c2: "$9,450",
          c3: "22 Aug 2026",
          status: "Overdue",
        },
      ]}
    />
  );
}
