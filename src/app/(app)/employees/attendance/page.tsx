"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { attendanceRows } from "@/data/mock";
import { getEmptyIconByTitle } from "@/lib/module-icons";

export default function EmployeeAttendancePage() {
  return (
    <>
      <PageHeader title="Attendance" section="Employees" hideTitle />
      <div className="container-fluid">
        <div className="stat-grid mb-4">
          <StatCard
            title="Present"
            value="189"
            change="88%"
            hint="today"
            description="Employees checked in"
            tone="success"
            icon="users"
          />
          <StatCard
            title="Late"
            value="11"
            change="+2"
            hint="today"
            description="Late arrivals"
            tone="warning"
            icon="clock"
            positive={false}
          />
          <StatCard
            title="Absent / Leave"
            value="15"
            change="7%"
            hint="today"
            description="Not available today"
            tone="danger"
            icon="calendar"
            positive={false}
          />
        </div>
        <DataTable
          title="Attendance"
          searchPlaceholder="Search attendance..."
          actionLabel="Export"
          rows={attendanceRows}
          searchKeys={["name", "date", "checkIn", "checkOut", "hours", "status"]}
          filterFields={[{ key: "status", label: "Status" }]}
          emptyStateIcon={getEmptyIconByTitle("Attendance")}
          columns={[
            {
              key: "name",
              header: "Employee",
              render: (row) => <PersonCell name={row.name} avatar={row.avatar} />,
            },
            { key: "date", header: "Date", render: (row) => row.date },
            { key: "checkIn", header: "Check In", render: (row) => row.checkIn },
            { key: "checkOut", header: "Check Out", render: (row) => row.checkOut },
            { key: "hours", header: "Hours", render: (row) => row.hours },
            {
              key: "status",
              header: "Status",
              render: (row) => <SoftStatus value={row.status} />,
            },
          ]}
        />
      </div>
    </>
  );
}
