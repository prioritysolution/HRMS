"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { LeaveRequestModal } from "@/components/modals/LeaveRequestModal";
import { useI18n, translateHrmsLookup } from "@/i18n";
import { leaveRows } from "@/data/mock";
import { getEmptyIconByTitle } from "@/lib/module-icons";

export default function LeavesPage() {
  const { language, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={t("employees.leaves.title")}
        section={t("employees.section")}
        hideTitle
      />
      <div className="container-fluid">
        <div className="stat-grid mb-4">
          <StatCard
            title={t("employees.leaves.pending")}
            value="7"
            change={t("employees.leaves.pendingHint")}
            hint={t("employees.leaves.review")}
            description={t("employees.leaves.pendingDesc")}
            tone="warning"
            icon="calendar"
          />
          <StatCard
            title={t("employees.leaves.approved")}
            value="42"
            change="+8%"
            hint={t("employees.leaves.month")}
            description={t("employees.leaves.approvedDesc")}
            tone="success"
            icon="users"
          />
          <StatCard
            title={t("employees.leaves.rejected")}
            value="4"
            change="-1"
            hint={t("employees.leaves.month")}
            description={t("employees.leaves.rejectedDesc")}
            tone="danger"
            icon="trendingDown"
            positive={false}
          />
        </div>
        <DataTable
          title={t("employees.leaves.title")}
          searchPlaceholder={t("employees.leaves.search")}
          actionLabel={t("employees.leaves.requestLeave")}
          onAction={() => setOpen(true)}
          rows={leaveRows}
          searchKeys={["name", "type", "from", "to", "days", "status"]}
          filterFields={[
            { key: "type", label: translateHrmsLookup(language, "labels", "Leave Type") },
            { key: "status", label: translateHrmsLookup(language, "labels", "Status") },
          ]}
          emptyStateIcon={getEmptyIconByTitle("Leaves")}
          columns={[
            {
              key: "name",
              header: translateHrmsLookup(language, "headers", "Employee"),
              render: (row) => <PersonCell name={row.name} avatar={row.avatar} />,
            },
            {
              key: "type",
              header: translateHrmsLookup(language, "headers", "Type"),
              render: (row) => row.type,
            },
            {
              key: "from",
              header: translateHrmsLookup(language, "headers", "From"),
              render: (row) => row.from,
            },
            {
              key: "to",
              header: translateHrmsLookup(language, "headers", "To"),
              render: (row) => row.to,
            },
            {
              key: "days",
              header: translateHrmsLookup(language, "headers", "Days"),
              render: (row) => row.days,
            },
            {
              key: "status",
              header: translateHrmsLookup(language, "headers", "Status"),
              render: (row) => <SoftStatus value={row.status} />,
            },
          ]}
        />
      </div>
      <LeaveRequestModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
