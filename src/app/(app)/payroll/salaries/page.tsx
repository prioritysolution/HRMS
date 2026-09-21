"use client";

import { ModulePage } from "@/components/ui/ModulePage";
import { useI18n, translateModuleStat } from "@/i18n";

export default function Page() {
  const { language, t } = useI18n();

  const stats = [
    {
      title: "Payroll Total",
      value: "$428k",
      change: "+3%",
      hint: "month",
      description: "Total salaries this cycle",
      tone: "primary" as const,
      icon: "briefcase" as const,
    },
    {
      title: "Processed",
      value: "198",
      change: "96%",
      hint: "cycle",
      description: "Employees paid this run",
      tone: "success" as const,
      icon: "users" as const,
    },
    {
      title: "Pending",
      value: "8",
      change: "2 holds",
      hint: "review",
      description: "Payslips awaiting approval",
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
      title={t("payroll.pages.salaries.title")}
      section={t("payroll.pages.salaries.section")}
      actionLabel={t("payroll.pages.salaries.action")}
      columns={[
        t("payroll.pages.salaries.columns.role"),
        t("payroll.pages.salaries.columns.netPay"),
        t("payroll.pages.salaries.columns.cycle"),
      ]}
      stats={stats}
      rows={[
        {
          primary: "Priya Sharma",
          secondary: "EMP-1042",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Engineering Lead",
          c2: "$6,850",
          c3: "Aug 2026",
          status: "Paid",
        },
        {
          primary: "Daniel Ortiz",
          secondary: "EMP-1108",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "Sales Manager",
          c2: "$5,920",
          c3: "Aug 2026",
          status: "Paid",
        },
        {
          primary: "Ava Collins",
          secondary: "EMP-1184",
          avatar: "/images/avatars/avatar7.jpg",
          c1: "Product Designer",
          c2: "$4,760",
          c3: "Aug 2026",
          status: "Pending",
        },
      ]}
    />
  );
}
