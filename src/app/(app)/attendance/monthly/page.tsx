"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useToast } from "@/components/ui/ToastProvider";
import { getHrmsModule } from "@/config/hrms-modules";
import { ApiError, attendanceService } from "@/lib/api";
import type { MonthlyAttendanceSummary } from "@/lib/api/types";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import type { HrmsRow } from "@/types/hrms";

const MODULE_ID = "monthly-attendance";
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function toPeriodValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parsePeriodValue(value: string): { year: number; month: number } | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}

function buildPeriodOptions(center = new Date()): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const start = new Date(center.getFullYear(), center.getMonth() - 18, 1);

  for (let i = 0; i < 30; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    options.push({
      value: toPeriodValue(year, month),
      label: `${MONTH_NAMES[month - 1]} ${year}`,
    });
  }

  return options.reverse();
}

function emptySummary(): MonthlyAttendanceSummary {
  return {
    Total_summaries: 0,
    Complete_count: 0,
    Pending_review: 0,
    Avg_present_days: 0,
  };
}

export default function MonthlyAttendancePage() {
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();
  const periodOptions = useMemo(() => buildPeriodOptions(), []);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return toPeriodValue(now.getFullYear(), now.getMonth() + 1);
  });
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [summary, setSummary] = useState<MonthlyAttendanceSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const selectedPeriod = useMemo(() => parsePeriodValue(period), [period]);

  const loadRows = useCallback(async () => {
    if (!selectedPeriod) return;

    setLoading(true);
    try {
      const result = await attendanceService.monthly({
        year: selectedPeriod.year,
        month: selectedPeriod.month,
      });
      setRows(result.rows);
      setSummary(result.summary);
    } catch (error) {
      setRows([]);
      setSummary(emptySummary());
      toast.error({
        title: "Unable to load monthly attendance",
        message:
          error instanceof ApiError
            ? error.message
            : "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial/async data load
    void loadRows();
  }, [loadRows]);

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        <div className="card mb-4">
          <div className="card-body">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full max-w-xs">
                <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Month &amp; Year
                </label>
                <SearchableSelect
                  value={period}
                  onChange={(value) => setPeriod(String(value))}
                  options={periodOptions}
                  clearable={false}
                  searchPlaceholder="Search month or year..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="stat-grid mb-4">
          <StatCard
            title="Summaries"
            value={String(summary.Total_summaries ?? 0)}
            change={`${summary.Complete_count ?? 0} complete`}
            hint="complete"
            description="Monthly attendance summaries"
            tone="info"
            icon="calendar"
          />
          <StatCard
            title="Avg Present"
            value={String(summary.Avg_present_days ?? 0)}
            change="days"
            hint="per emp"
            description="Average present days"
            tone="success"
            icon="users"
          />
          <StatCard
            title="Pending Review"
            value={String(summary.Pending_review ?? 0)}
            change="awaiting"
            hint="close"
            description="Summaries not yet closed"
            tone="warning"
            icon="clock"
            positive={false}
          />
        </div>

        <DataTable
          title={config.title}
          searchPlaceholder="Search monthly attendance..."
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={[{ key: "Attendance_status", label: "Summary" }]}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle="No monthly attendance yet"
          emptyStateMessage="No attendance summaries found for the selected month."
          columns={[
            {
              key: "Employee_name",
              header: "Employee",
              render: (row) => (
                <PersonCell
                  name={String(row.Employee_name ?? "—")}
                  subtitle={String(row.Employee_code ?? "")}
                  avatar={String(row.Photo_path ?? "") || undefined}
                />
              ),
            },
            {
              key: "Month_year",
              header: "Month",
              render: (row) => formatCell(row.Month_year),
            },
            {
              key: "Present_days",
              header: "Present",
              render: (row) => formatCell(row.Present_days),
            },
            {
              key: "Absent_days",
              header: "Absent",
              render: (row) => formatCell(row.Absent_days),
            },
            {
              key: "Half_day_days",
              header: "Half Day",
              render: (row) => formatCell(row.Half_day_days),
            },
            {
              key: "Late_days",
              header: "Late",
              render: (row) => formatCell(row.Late_days),
            },
            {
              key: "Overtime_hours",
              header: "OT (hrs)",
              render: (row) => formatCell(row.Overtime_hours),
            },
            {
              key: "Attendance_status",
              header: "Summary",
              render: (row) => (
                <SoftStatus value={String(row.Attendance_status ?? "—")} />
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
