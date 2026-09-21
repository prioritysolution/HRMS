"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, PersonCell } from "@/components/ui/DataTable";
import { ReportExportButtons } from "@/components/reports/ReportExportButtons";
import { useToast } from "@/components/ui/ToastProvider";
import { getHrmsModule } from "@/config/hrms-modules";
import {
  ApiError,
  attendanceSummaryReportService,
  branchService,
  departmentService,
} from "@/lib/api";
import { pad2 } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { useI18n, translateHrmsLookup } from "@/i18n";
import type {
  ReportExportColumn,
  ReportFieldGroup,
} from "@/lib/report-export";
import type { HrmsRow } from "@/types/hrms";

const MODULE_ID = "attendance-summary-report";

const EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: "Employee_code", header: "Employee Code" },
  { key: "Display_name", header: "Employee Name" },
  { key: "Branch_Name", header: "Branch" },
  { key: "Dept_Name", header: "Department" },
  { key: "Present_count", header: "Present" },
  { key: "Absent_count", header: "Absent" },
  { key: "Half_day_count", header: "Half Day" },
  { key: "Late_status_count", header: "Late Status" },
  { key: "Leave_count", header: "Leave" },
  { key: "Late_coming_days", header: "Late Coming Days" },
  { key: "Early_leaving_days", header: "Early Leaving Days" },
  { key: "Total_late_minutes", header: "Total Late (Mins)" },
  { key: "Total_early_leave_minutes", header: "Total Early (Mins)" },
  { key: "Total_working_hours", header: "Working Hours" },
  { key: "Total_overtime_hours", header: "Overtime Hours" },
];

const PDF_FIELD_GROUPS: ReportFieldGroup[] = [
  {
    title: "Employee",
    fields: [
      { key: "Employee_code", header: "Employee Code" },
      { key: "Display_name", header: "Employee Name" },
      { key: "Branch_Name", header: "Branch" },
      { key: "Dept_Name", header: "Department" },
    ],
  },
  {
    title: "Attendance Counts",
    fields: [
      { key: "Present_count", header: "Present" },
      { key: "Absent_count", header: "Absent" },
      { key: "Half_day_count", header: "Half Day" },
      { key: "Leave_count", header: "Leave" },
      { key: "Late_status_count", header: "Late Status" },
    ],
  },
  {
    title: "Late / Early",
    fields: [
      { key: "Late_coming_days", header: "Late Coming Days" },
      { key: "Early_leaving_days", header: "Early Leaving Days" },
      { key: "Total_late_minutes", header: "Total Late (Mins)" },
      { key: "Total_early_leave_minutes", header: "Total Early (Mins)" },
    ],
  },
  {
    title: "Hours",
    fields: [
      { key: "Total_working_hours", header: "Working Hours" },
      { key: "Total_overtime_hours", header: "Overtime Hours" },
    ],
  },
];

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    from: `${year}-${pad2(month + 1)}-01`,
    to: `${year}-${pad2(month + 1)}-${pad2(lastDay)}`,
  };
}

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function formatNumber(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "0";
  return String(value);
}

export default function AttendanceSummaryReportPage() {
  const { language, t } = useI18n();
  const config = getHrmsModule(MODULE_ID);
  const pageTitle = translateHrmsLookup(language, "titles", config.title);
  const pageSection = translateHrmsLookup(language, "sections", config.section);
  const toast = useToast();
  const defaults = useMemo(() => currentMonthRange(), []);

  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);

  const [branchOptions, setBranchOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [deptOptions, setDeptOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const exportColumns = useMemo(
    () =>
      EXPORT_COLUMNS.map((column) => ({
        ...column,
        header: translateHrmsLookup(language, "headers", column.header),
      })),
    [language],
  );

  const pdfFieldGroups = useMemo(
    () =>
      PDF_FIELD_GROUPS.map((group) => ({
        ...group,
        title: translateHrmsLookup(language, "labels", group.title),
        fields: group.fields.map((field) => ({
          ...field,
          header: translateHrmsLookup(language, "headers", field.header),
        })),
      })),
    [language],
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await attendanceSummaryReportService.list({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setRows(data);
      setFilteredRows(data);
    } catch (error) {
      setRows([]);
      setFilteredRows([]);
      toast.error({
        title: t("reports.attendanceSummary.loadError"),
        message:
          error instanceof ApiError
            ? error.message
            : t("reports.common.connectionError"),
      });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, t, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial/async data load
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      try {
        const [branches, departments] = await Promise.all([
          branchService.list({ status: 1 }),
          departmentService.list({ status: 1 }),
        ]);
        if (cancelled) return;

        setBranchOptions(
          branches
            .map((row) => {
              const label = String(row.Branch_Name ?? "").trim();
              return label ? { value: label, label } : null;
            })
            .filter((option): option is { value: string; label: string } => option !== null),
        );
        setDeptOptions(
          departments
            .map((row) => {
              const label = String(row.Dept_Name ?? "").trim();
              return label ? { value: label, label } : null;
            })
            .filter((option): option is { value: string; label: string } => option !== null),
        );
      } catch {
        if (!cancelled) {
          setBranchOptions([]);
          setDeptOptions([]);
        }
      }
    }

    void loadLookups();
    return () => {
      cancelled = true;
    };
  }, []);

  const filterFields = useMemo(
    () => [
      {
        key: "Branch_Name",
        label: translateHrmsLookup(language, "labels", "Branch"),
        options: branchOptions,
      },
      {
        key: "Dept_Name",
        label: translateHrmsLookup(language, "labels", "Department"),
        options: deptOptions,
      },
    ],
    [branchOptions, deptOptions, language],
  );

  const filterSummary = useMemo(() => {
    const count = filteredRows.length;
    const base =
      count === 1
        ? t("reports.common.filterSummaryEmployee", { count })
        : t("reports.common.filterSummaryEmployees", { count });
    const range =
      fromDate || toDate
        ? t("reports.common.dateRange", {
            from: fromDate || "…",
            to: toDate || "…",
          })
        : "";
    return `${base}${range}`;
  }, [filteredRows.length, fromDate, toDate, t]);

  const handleFilteredRowsChange = useCallback((next: HrmsRow[]) => {
    setFilteredRows(next);
  }, []);

  return (
    <>
      <PageHeader title={pageTitle} section={pageSection} hideTitle />
      <div className="container-fluid">
        <DataTable
          title={pageTitle}
          searchPlaceholder={t("reports.attendanceSummary.searchPlaceholder")}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          showRowActions={false}
          onFilteredRowsChange={handleFilteredRowsChange}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle={t("attendance.pages.reportSummary.emptyTitle")}
          emptyStateMessage={t("attendance.pages.reportSummary.empty")}
          filterExtra={
            <>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="attendance-summary-from">
                  {translateHrmsLookup(language, "labels", "From")}
                </label>
                <input
                  id="attendance-summary-from"
                  type="date"
                  className="form-control form-control-sm"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="attendance-summary-to">
                  {translateHrmsLookup(language, "labels", "To")}
                </label>
                <input
                  id="attendance-summary-to"
                  type="date"
                  className="form-control form-control-sm"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </>
          }
          extraActions={
            <ReportExportButtons
              title={t("reports.attendanceSummary.exportTitle")}
              rows={filteredRows}
              columns={exportColumns}
              filterSummary={filterSummary}
              pdfLayout="cards"
              fieldGroups={pdfFieldGroups}
              cardTitle={{
                primaryKey: "Display_name",
                secondaryKey: "Employee_code",
                badgeKey: "Dept_Name",
              }}
              sheetName={t("reports.attendanceSummary.sheetName")}
              disabled={loading}
              emptyMessage={t("reports.attendanceSummary.emptyExport")}
              successMessage={t("reports.attendanceSummary.successExport")}
            />
          }
          columns={[
            {
              key: "Display_name",
              header: translateHrmsLookup(language, "headers", "Employee"),
              render: (row) => (
                <PersonCell
                  name={String(row.Display_name ?? row.Employee_name ?? "")}
                  subtitle={String(row.Employee_code ?? "")}
                  avatar={row.Photo_path || (row as any).photo_path || (row as any).avatar}
                />
              ),
            },
            {
              key: "Branch_Name",
              header: translateHrmsLookup(language, "headers", "Branch"),
              render: (row) => formatCell(row.Branch_Name),
            },
            {
              key: "Dept_Name",
              header: translateHrmsLookup(language, "headers", "Department"),
              render: (row) => formatCell(row.Dept_Name),
            },
            {
              key: "Present_count",
              header: translateHrmsLookup(language, "headers", "Present"),
              render: (row) => formatNumber(row.Present_count),
            },
            {
              key: "Absent_count",
              header: translateHrmsLookup(language, "headers", "Absent"),
              render: (row) => formatNumber(row.Absent_count),
            },
            {
              key: "Half_day_count",
              header: translateHrmsLookup(language, "headers", "Half Day"),
              render: (row) => formatNumber(row.Half_day_count),
            },
            {
              key: "Leave_count",
              header: translateHrmsLookup(language, "headers", "Leave"),
              render: (row) => formatNumber(row.Leave_count),
            },
            {
              key: "Late_coming_days",
              header: translateHrmsLookup(language, "headers", "Late Days"),
              render: (row) => formatNumber(row.Late_coming_days),
            },
            {
              key: "Early_leaving_days",
              header: translateHrmsLookup(language, "headers", "Early Days"),
              render: (row) => formatNumber(row.Early_leaving_days),
            },
            {
              key: "Total_late_minutes",
              header: translateHrmsLookup(language, "headers", "Late (Mins)"),
              render: (row) => formatNumber(row.Total_late_minutes),
            },
            {
              key: "Total_early_leave_minutes",
              header: translateHrmsLookup(language, "headers", "Early (Mins)"),
              render: (row) => formatNumber(row.Total_early_leave_minutes),
            },
            {
              key: "Total_working_hours",
              header: translateHrmsLookup(language, "headers", "Working Hrs"),
              render: (row) => formatNumber(row.Total_working_hours),
            },
            {
              key: "Total_overtime_hours",
              header: translateHrmsLookup(language, "headers", "OT Hrs"),
              render: (row) => formatNumber(row.Total_overtime_hours),
            },
          ]}
        />
      </div>
    </>
  );
}
