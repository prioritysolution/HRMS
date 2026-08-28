"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { LeaveRequestModal } from "@/components/modals/LeaveRequestModal";
import { leaveRows } from "@/data/mock";
import { getEmptyIconByTitle } from "@/lib/module-icons";

export default function LeavesPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader title="Leaves" section="Employees" hideTitle />
      <div className="container-fluid">
        <div className="stat-grid mb-4">
          <StatCard
            title="Pending"
            value="7"
            change="3 urgent"
            hint="review"
            description="Awaiting approval"
            tone="warning"
            icon="calendar"
          />
          <StatCard
            title="Approved"
            value="42"
            change="+8%"
            hint="month"
            description="Approved this month"
            tone="success"
            icon="users"
          />
          <StatCard
            title="Rejected"
            value="4"
            change="-1"
            hint="month"
            description="Declined requests"
            tone="danger"
            icon="trendingDown"
            positive={false}
          />
        </div>
        <DataTable
          title="Leaves"
          searchPlaceholder="Search leave requests..."
          actionLabel="Request Leave"
          onAction={() => setOpen(true)}
          rows={leaveRows}
          searchKeys={["name", "type", "from", "to", "days", "status"]}
          filterFields={[
            { key: "type", label: "Leave Type" },
            { key: "status", label: "Status" },
          ]}
          emptyStateIcon={getEmptyIconByTitle("Leaves")}
          columns={[
            {
              key: "name",
              header: "Employee",
              render: (row) => <PersonCell name={row.name} avatar={row.avatar} />,
            },
            { key: "type", header: "Type", render: (row) => row.type },
            { key: "from", header: "From", render: (row) => row.from },
            { key: "to", header: "To", render: (row) => row.to },
            { key: "days", header: "Days", render: (row) => row.days },
            {
              key: "status",
              header: "Status",
              render: (row) => <SoftStatus value={row.status} />,
            },
          ]}
        />
      </div>
      <LeaveRequestModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
