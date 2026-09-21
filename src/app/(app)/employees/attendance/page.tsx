"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { useI18n, translateHrmsLookup } from "@/i18n";
import { attendanceRows } from "@/data/mock";
import { getEmptyIconByTitle } from "@/lib/module-icons";

export default function EmployeeAttendancePage() {
  const { language, t } = useI18n();

  return (
    <>
      <PageHeader
        title={t("employees.attendance.title")}
        section={t("employees.section")}
        hideTitle
      />
      <div className="container-fluid">
        <div className="stat-grid mb-4">
          <StatCard
            title={t("employees.attendance.present")}
            value="189"
            change="88%"
            hint={t("employees.attendance.today")}
            description={t("employees.attendance.presentDesc")}
            tone="success"
            icon="users"
          />
          <StatCard
            title={t("employees.attendance.late")}
            value="11"
            change="+2"
            hint={t("employees.attendance.today")}
            description={t("employees.attendance.lateDesc")}
            tone="warning"
            icon="clock"
            positive={false}
          />
          <StatCard
            title={t("employees.attendance.absentLeave")}
            value="15"
            change="7%"
            hint={t("employees.attendance.today")}
            description={t("employees.attendance.absentLeaveDesc")}
            tone="danger"
            icon="calendar"
            positive={false}
          />
        </div>
        <DataTable
          title={t("employees.attendance.title")}
          searchPlaceholder={t("employees.attendance.search")}
          actionLabel={t("employees.attendance.export")}
          rows={attendanceRows}
          searchKeys={["name", "date", "checkIn", "checkOut", "hours", "status"]}
          filterFields={[
            { key: "status", label: translateHrmsLookup(language, "labels", "Status") },
          ]}
          emptyStateIcon={getEmptyIconByTitle("Attendance")}
          columns={[
            {
              key: "name",
              header: translateHrmsLookup(language, "headers", "Employee"),
              render: (row) => <PersonCell name={row.name} avatar={row.avatar} />,
            },
            {
              key: "date",
              header: translateHrmsLookup(language, "headers", "Date"),
              render: (row) => row.date,
            },
            {
              key: "checkIn",
              header: translateHrmsLookup(language, "headers", "Check In"),
              render: (row) => row.checkIn,
            },
            {
              key: "checkOut",
              header: translateHrmsLookup(language, "headers", "Check Out"),
              render: (row) => row.checkOut,
            },
            {
              key: "hours",
              header: translateHrmsLookup(language, "headers", "Hours"),
              render: (row) => row.hours,
            },
            {
              key: "status",
              header: translateHrmsLookup(language, "headers", "Status"),
              render: (row) => <SoftStatus value={row.status} />,
            },
          ]}
        />
      </div>
    </>
  );
}
