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
import { useI18n, translateHrmsLookup, translateModuleStat } from "@/i18n";
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
  const { language, t } = useI18n();
  const config = getHrmsModule(MODULE_ID);
  const pageTitle = translateHrmsLookup(language, "titles", config.title);
  const pageSection = translateHrmsLookup(language, "sections", config.section);
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
        title: t("attendance.pages.monthly.loadFailed"),
        message:
          error instanceof ApiError
            ? error.message
            : t("attendance.pages.monthly.loadFailedMessage"),
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, toast, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial/async data load
    void loadRows();
  }, [loadRows]);

  return (
    <>
      <PageHeader title={pageTitle} section={pageSection} hideTitle />
      <div className="container-fluid">
        <div className="card mb-4">
          <div className="card-body">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full max-w-xs">
                <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  {t("attendance.pages.monthly.periodLabel")}
                </label>
                <SearchableSelect
                  value={period}
                  onChange={(value) => setPeriod(String(value))}
                  options={periodOptions}
                  clearable={false}
                  searchPlaceholder={t("attendance.pages.monthly.searchPeriod")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="stat-grid mb-4">
          <StatCard
            title={translateModuleStat(language, "Summaries", "title", "Summaries")}
            value={String(summary.Total_summaries ?? 0)}
            change={`${summary.Complete_count ?? 0} complete`}
            hint={translateModuleStat(language, "Summaries", "hint", "complete")}
            description={translateModuleStat(
              language,
              "Summaries",
              "description",
              "Monthly attendance summaries",
            )}
            tone="info"
            icon="calendar"
          />
          <StatCard
            title={translateModuleStat(language, "Avg Present", "title", "Avg Present")}
            value={String(summary.Avg_present_days ?? 0)}
            change="days"
            hint={translateModuleStat(language, "Avg Present", "hint", "per emp")}
            description={translateModuleStat(
              language,
              "Avg Present",
              "description",
              "Average present days",
            )}
            tone="success"
            icon="users"
          />
          <StatCard
            title={translateModuleStat(language, "Pending Review", "title", "Pending Review")}
            value={String(summary.Pending_review ?? 0)}
            change="awaiting"
            hint={translateModuleStat(language, "Pending Review", "hint", "close")}
            description={translateModuleStat(
              language,
              "Pending Review",
              "description",
              "Summaries not yet closed",
            )}
            tone="warning"
            icon="clock"
            positive={false}
          />
        </div>

        <DataTable
          title={pageTitle}
          searchPlaceholder={t("attendance.pages.monthly.searchPlaceholder")}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={[
            {
              key: "Attendance_status",
              label: translateHrmsLookup(language, "labels", "Summary"),
            },
          ]}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle={t("attendance.pages.monthly.emptyTitle")}
          emptyStateMessage={t("attendance.pages.monthly.empty")}
          columns={[
            {
              key: "Employee_name",
              header: translateHrmsLookup(language, "headers", "Employee"),
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
              header: translateHrmsLookup(language, "headers", "Month"),
              render: (row) => formatCell(row.Month_year),
            },
            {
              key: "Present_days",
              header: translateHrmsLookup(language, "headers", "Present"),
              render: (row) => formatCell(row.Present_days),
            },
            {
              key: "Absent_days",
              header: translateHrmsLookup(language, "headers", "Absent"),
              render: (row) => formatCell(row.Absent_days),
            },
            {
              key: "Half_day_days",
              header: translateHrmsLookup(language, "headers", "Half Day"),
              render: (row) => formatCell(row.Half_day_days),
            },
            {
              key: "Late_days",
              header: translateHrmsLookup(language, "headers", "Late"),
              render: (row) => formatCell(row.Late_days),
            },
            {
              key: "Overtime_hours",
              header: translateHrmsLookup(language, "headers", "OT (hrs)"),
              render: (row) => formatCell(row.Overtime_hours),
            },
            {
              key: "Attendance_status",
              header: translateHrmsLookup(language, "headers", "Summary"),
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
