"use client";

import { ModulePage } from "@/components/ui/ModulePage";
import { useI18n, translateModuleStat } from "@/i18n";

export default function Page() {
  const { language, t } = useI18n();

  const stats = [
    {
      title: "This Month",
      value: "$18.4k",
      change: "+6%",
      hint: "month",
      description: "Total expenses claimed",
      tone: "primary" as const,
      icon: "briefcase" as const,
    },
    {
      title: "Approved",
      value: "$14.2k",
      change: "+4%",
      hint: "month",
      description: "Expenses cleared for payout",
      tone: "success" as const,
      icon: "users" as const,
    },
    {
      title: "Awaiting",
      value: "11",
      change: "3 urgent",
      hint: "review",
      description: "Claims pending approval",
      tone: "warning" as const,
      icon: "clock" as const,
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
      title={t("payroll.pages.expenses.title")}
      section={t("payroll.pages.expenses.section")}
      actionLabel={t("payroll.pages.expenses.action")}
      columns={[
        t("payroll.pages.expenses.columns.category"),
        t("payroll.pages.expenses.columns.submittedBy"),
        t("payroll.pages.expenses.columns.amount"),
      ]}
      stats={stats}
      rows={[
        {
          primary: "Client travel — NYC",
          secondary: "EXP-881",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "Travel",
          c2: "Daniel Ortiz",
          c3: "$1,240",
          status: "Pending",
        },
        {
          primary: "Design tooling licenses",
          secondary: "EXP-884",
          avatar: "/images/avatars/avatar7.jpg",
          c1: "Software",
          c2: "Ava Collins",
          c3: "$480",
          status: "Approved",
        },
        {
          primary: "Team offsite catering",
          secondary: "EXP-889",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Meals",
          c2: "Priya Sharma",
          c3: "$620",
          status: "Paid",
        },
      ]}
    />
  );
}
