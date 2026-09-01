"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, SoftStatus, type Column } from "@/components/ui/DataTable";
import { getEssModule } from "@/config/ess-modules";
import { getEssMockRows } from "@/data/ess-mock";
import { authService } from "@/lib/api/services/auth.service";
import { getEssEmployeeCode } from "@/lib/ess-utils";
import { formatDateDisplay } from "@/lib/date-utils";
import type { HrmsRow } from "@/types/hrms";

function buildSimpleColumns(moduleId: "ess-attendance" | "ess-monthly-attendance") {
  const config = getEssModule(moduleId);
  return config.columns.map((col) => ({
    key: col.key,
    header: col.header,
    render: (row: HrmsRow) => {
      if (col.type === "status") return <SoftStatus value={String(row[col.key] ?? "—")} />;
      if (col.type === "date") return formatDateDisplay(String(row[col.key] ?? "")) || "—";
      return String(row[col.key] ?? "—");
    },
  })) as Column<HrmsRow>[];
}

export default function EssAttendancePage() {
  const [dailyRows, setDailyRows] = useState<HrmsRow[]>([]);
  const [monthlyRows, setMonthlyRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"daily" | "monthly">("daily");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await authService.getMeProfile();
      const code = getEssEmployeeCode(null, me);
      setDailyRows(getEssMockRows("ess-attendance", code));
      setMonthlyRows(getEssMockRows("ess-monthly-attendance", code));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dailyCols = useMemo(() => buildSimpleColumns("ess-attendance"), []);
  const monthlyCols = useMemo(() => buildSimpleColumns("ess-monthly-attendance"), []);

  const presentDays = Number(monthlyRows[0]?.Present_days ?? 0);
  const lateDays = Number(monthlyRows[0]?.Late_days ?? 0);

  return (
    <>
      <PageHeader title="My Attendance" section="Employee Self Service" />
      <div className="container-fluid">
        <div className="ess-stat-grid ess-stat-grid--two mb-4">
          <StatCard
            title="Present This Month"
            value={String(presentDays)}
            change="+2"
            hint="vs last month"
            description="Total present days recorded"
            tone="success"
            icon="calendar"
            positive
          />
          <StatCard
            title="Late Days"
            value={String(lateDays)}
            change="-1"
            hint="vs last month"
            description="Days with late check-in"
            tone="warning"
            icon="clock"
            positive={false}
          />
        </div>

        <div className="ess-tabs mb-3">
          <button
            type="button"
            className={`ess-tab${tab === "daily" ? " ess-tab--active" : ""}`}
            onClick={() => setTab("daily")}
          >
            Daily Records
          </button>
          <button
            type="button"
            className={`ess-tab${tab === "monthly" ? " ess-tab--active" : ""}`}
            onClick={() => setTab("monthly")}
          >
            Monthly Summary
          </button>
        </div>

        {tab === "daily" ? (
          <DataTable
            columns={dailyCols}
            rows={dailyRows}
            title="Daily Attendance"
            searchPlaceholder="Search by date or status…"
            searchKeys={["Attendance_date", "Attendance_status"]}
            loading={loading}
            emptyStateMessage="No attendance records for the selected period."
          />
        ) : (
          <DataTable
            columns={monthlyCols}
            rows={monthlyRows}
            title="Monthly Attendance"
            searchPlaceholder="Search by month…"
            searchKeys={["Month_year"]}
            loading={loading}
            emptyStateMessage="No monthly summary available."
          />
        )}
      </div>
    </>
  );
}
