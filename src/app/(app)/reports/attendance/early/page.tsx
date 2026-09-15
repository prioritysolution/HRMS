"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ClampedText,
  DataTable,
  PersonCell,
  SoftStatus,
} from "@/components/ui/DataTable";
import { ReportExportButtons } from "@/components/reports/ReportExportButtons";
import { useToast } from "@/components/ui/ToastProvider";
import { getHrmsModule } from "@/config/hrms-modules";
import {
  ApiError,
  branchService,
  departmentService,
  earlyLeavingReportService,
} from "@/lib/api";
import { formatDateDisplay, pad2 } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import type {
  ReportExportColumn,
  ReportFieldGroup,
} from "@/lib/report-export";
import type { HrmsRow } from "@/types/hrms";

const MODULE_ID = "early-leaving-report";

const EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: "Employee_code", header: "Employee Code" },
  { key: "Display_name", header: "Employee Name" },
  { key: "Branch_Name", header: "Branch" },
  { key: "Dept_Name", header: "Department" },
  { key: "Desig_Name", header: "Designation" },
  { key: "Attendance_date", header: "Date" },
  { key: "Shift_name", header: "Shift" },
  { key: "Shift_end", header: "Shift End" },
  { key: "Check_in", header: "Check In" },
  { key: "Check_out", header: "Check Out" },
  { key: "Early_leave_minutes", header: "Early (Mins)" },
  { key: "Status", header: "Status" },
  { key: "Source_name", header: "Source" },
  { key: "Remarks", header: "Remarks" },
];

const PDF_FIELD_GROUPS: ReportFieldGroup[] = [
  {
    title: "Employee",
    fields: [
      { key: "Employee_code", header: "Employee Code" },
      { key: "Display_name", header: "Employee Name" },
      { key: "Branch_Name", header: "Branch" },
      { key: "Dept_Name", header: "Department" },
      { key: "Desig_Name", header: "Designation" },
    ],
  },
  {
    title: "Early Leaving",
    fields: [
      { key: "Attendance_date", header: "Date" },
      { key: "Status", header: "Status" },
      { key: "Shift_name", header: "Shift" },
      { key: "Shift_end", header: "Shift End" },
      { key: "Check_in", header: "Check In" },
      { key: "Check_out", header: "Check Out" },
      { key: "Early_leave_minutes", header: "Early (Mins)" },
      { key: "Source_name", header: "Source" },
    ],
  },
  {
    title: "Remarks",
    fields: [{ key: "Remarks", header: "Remarks", fullWidth: true }],
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

export default function EarlyLeavingReportPage() {
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();
  const defaults = useMemo(() => currentMonthRange(), []);

  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [minEarlyMinutes, setMinEarlyMinutes] = useState("");

  const [branchOptions, setBranchOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [deptOptions, setDeptOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await earlyLeavingReportService.list({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        min_early_minutes: minEarlyMinutes || undefined,
      });
      setRows(data);
      setFilteredRows(data);
    } catch (error) {
      setRows([]);
      setFilteredRows([]);
      toast.error({
        title: "Unable to load early leaving report",
        message:
          error instanceof ApiError
            ? error.message
            : "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, minEarlyMinutes, toast]);

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
            .map((row) => ({
              value: String(row.Branch_Id ?? row.id ?? ""),
              label: String(row.Branch_Name ?? ""),
            }))
            .filter((option) => option.value && option.label),
        );
        setDeptOptions(
          departments
            .map((row) => ({
              value: String(row.Dept_Id ?? row.id ?? ""),
              label: String(row.Dept_Name ?? ""),
            }))
            .filter((option) => option.value && option.label),
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
      { key: "Branch_Id", label: "Branch", options: branchOptions },
      { key: "Dept_Id", label: "Department", options: deptOptions },
    ],
    [branchOptions, deptOptions],
  );

  const filterSummary = useMemo(() => {
    const count = filteredRows.length;
    const range =
      fromDate || toDate
        ? ` · ${fromDate || "…"} to ${toDate || "…"}`
        : "";
    const minEarly = minEarlyMinutes
      ? ` · min early ≥ ${minEarlyMinutes} mins`
      : "";
    return `${count} record${count === 1 ? "" : "s"} (as per current filters)${range}${minEarly}`;
  }, [filteredRows.length, fromDate, toDate, minEarlyMinutes]);

  const handleFilteredRowsChange = useCallback((next: HrmsRow[]) => {
    setFilteredRows(next);
  }, []);

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        <DataTable
          title={config.title}
          searchPlaceholder="Search early leaving report..."
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          showRowActions={false}
          onFilteredRowsChange={handleFilteredRowsChange}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle="No early leaving records found"
          emptyStateMessage="Try adjusting the date range or minimum early minutes."
          filterExtra={
            <>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="early-leaving-from">
                  From
                </label>
                <input
                  id="early-leaving-from"
                  type="date"
                  className="form-control form-control-sm"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="early-leaving-to">
                  To
                </label>
                <input
                  id="early-leaving-to"
                  type="date"
                  className="form-control form-control-sm"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="early-leaving-min">
                  Min Early (Mins)
                </label>
                <input
                  id="early-leaving-min"
                  type="number"
                  min={0}
                  className="form-control form-control-sm"
                  placeholder="e.g. 10"
                  value={minEarlyMinutes}
                  onChange={(event) => setMinEarlyMinutes(event.target.value)}
                />
              </div>
            </>
          }
          extraActions={
            <ReportExportButtons
              title="Early Leaving Report"
              rows={filteredRows}
              columns={EXPORT_COLUMNS}
              filterSummary={filterSummary}
              pdfLayout="cards"
              fieldGroups={PDF_FIELD_GROUPS}
              cardTitle={{
                primaryKey: "Display_name",
                secondaryKey: "Employee_code",
                badgeKey: "Status",
              }}
              sheetName="Early Leaving"
              disabled={loading}
              emptyMessage="No early leaving records match the current filters."
              successMessage="Download started for the filtered early leaving report."
            />
          }
          columns={[
            {
              key: "Display_name",
              header: "Employee",
              render: (row) => (
                <PersonCell
                  name={String(row.Display_name ?? row.Employee_name ?? "")}
                  subtitle={String(row.Employee_code ?? "")}
                />
              ),
            },
            {
              key: "Attendance_date",
              header: "Date",
              render: (row) =>
                formatDateDisplay(
                  String(row.Attendance_date_raw ?? row.Attendance_date ?? ""),
                ) || formatCell(row.Attendance_date),
            },
            {
              key: "Branch_Name",
              header: "Branch",
              render: (row) => formatCell(row.Branch_Name),
            },
            {
              key: "Dept_Name",
              header: "Department",
              render: (row) => formatCell(row.Dept_Name),
            },
            {
              key: "Shift_name",
              header: "Shift",
              render: (row) => formatCell(row.Shift_name),
            },
            {
              key: "Shift_end",
              header: "Shift End",
              render: (row) => formatCell(row.Shift_end),
            },
            {
              key: "Check_out",
              header: "Check Out",
              render: (row) => formatCell(row.Check_out),
            },
            {
              key: "Early_leave_minutes",
              header: "Early (Mins)",
              render: (row) => formatNumber(row.Early_leave_minutes),
            },
            {
              key: "Status",
              header: "Status",
              render: (row) => (
                <SoftStatus
                  value={String(row.Status ?? row.Attendance_status_name ?? "")}
                />
              ),
            },
            {
              key: "Source_name",
              header: "Source",
              render: (row) => formatCell(row.Source_name),
            },
            {
              key: "Remarks",
              header: "Remarks",
              render: (row) => <ClampedText text={String(row.Remarks ?? "")} />,
            },
          ]}
        />
      </div>
    </>
  );
}
