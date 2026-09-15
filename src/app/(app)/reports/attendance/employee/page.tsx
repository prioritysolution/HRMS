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
  applOptionService,
  applOptionsToSelectOptions,
  branchService,
  departmentService,
  employeeAttendanceReportService,
} from "@/lib/api";
import { formatDateDisplay, pad2 } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import type {
  ReportExportColumn,
  ReportFieldGroup,
} from "@/lib/report-export";
import type { HrmsRow } from "@/types/hrms";

const MODULE_ID = "employee-attendance-report";
const ATTENDANCE_STATUS_OPT_GRP_ID = 8;

const EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: "Employee_code", header: "Employee Code" },
  { key: "Display_name", header: "Employee Name" },
  { key: "Branch_Name", header: "Branch" },
  { key: "Dept_Name", header: "Department" },
  { key: "Desig_Name", header: "Designation" },
  { key: "Attendance_date", header: "Date" },
  { key: "Shift_name", header: "Shift" },
  { key: "Shift_start", header: "Shift Start" },
  { key: "Shift_end", header: "Shift End" },
  { key: "Check_in", header: "Check In" },
  { key: "Check_out", header: "Check Out" },
  { key: "Working_hours", header: "Working Hours" },
  { key: "Overtime_hours", header: "Overtime Hours" },
  { key: "Late_minutes", header: "Late (Mins)" },
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
      { key: "Mobile", header: "Mobile" },
    ],
  },
  {
    title: "Attendance",
    fields: [
      { key: "Attendance_date", header: "Date" },
      { key: "Status", header: "Status" },
      { key: "Shift_name", header: "Shift" },
      { key: "Source_name", header: "Source" },
      { key: "Check_in", header: "Check In" },
      { key: "Check_out", header: "Check Out" },
    ],
  },
  {
    title: "Metrics",
    fields: [
      { key: "Working_hours", header: "Working Hours" },
      { key: "Overtime_hours", header: "Overtime Hours" },
      { key: "Late_minutes", header: "Late (Mins)" },
      { key: "Early_leave_minutes", header: "Early (Mins)" },
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

export default function EmployeeAttendanceReportPage() {
  const config = getHrmsModule(MODULE_ID);
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
  const [statusOptions, setStatusOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employeeAttendanceReportService.list({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setRows(data);
      setFilteredRows(data);
    } catch (error) {
      setRows([]);
      setFilteredRows([]);
      toast.error({
        title: "Unable to load employee attendance",
        message:
          error instanceof ApiError
            ? error.message
            : "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial/async data load
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      try {
        const [branches, departments, statusOpts] = await Promise.all([
          branchService.list({ status: 1 }),
          departmentService.list({ status: 1 }),
          applOptionService.list({
            opt_grp_id: ATTENDANCE_STATUS_OPT_GRP_ID,
            is_active: 1,
          }),
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
        setStatusOptions(applOptionsToSelectOptions(statusOpts));
      } catch {
        if (!cancelled) {
          setBranchOptions([]);
          setDeptOptions([]);
          setStatusOptions([]);
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
      {
        key: "Attendance_status_code",
        label: "Status",
        options: statusOptions,
      },
    ],
    [branchOptions, deptOptions, statusOptions],
  );

  const filterSummary = useMemo(() => {
    const count = filteredRows.length;
    const range =
      fromDate || toDate
        ? ` · ${fromDate || "…"} to ${toDate || "…"}`
        : "";
    return `${count} record${count === 1 ? "" : "s"} (as per current filters)${range}`;
  }, [filteredRows.length, fromDate, toDate]);

  const handleFilteredRowsChange = useCallback((next: HrmsRow[]) => {
    setFilteredRows(next);
  }, []);

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        <DataTable
          title={config.title}
          searchPlaceholder="Search employee attendance..."
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          showRowActions={false}
          onFilteredRowsChange={handleFilteredRowsChange}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle="No attendance records found"
          emptyStateMessage="Try adjusting the date range or filters."
          filterExtra={
            <>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="emp-attendance-from">
                  From
                </label>
                <input
                  id="emp-attendance-from"
                  type="date"
                  className="form-control form-control-sm"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="emp-attendance-to">
                  To
                </label>
                <input
                  id="emp-attendance-to"
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
              title="Employee Attendance Report"
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
              sheetName="Employee Attendance"
              disabled={loading}
              emptyMessage="No attendance records match the current filters."
              successMessage="Download started for the filtered employee attendance report."
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
              key: "Check_in",
              header: "Check In",
              render: (row) => formatCell(row.Check_in),
            },
            {
              key: "Check_out",
              header: "Check Out",
              render: (row) => formatCell(row.Check_out),
            },
            {
              key: "Working_hours",
              header: "Working Hrs",
              render: (row) => formatNumber(row.Working_hours),
            },
            {
              key: "Late_minutes",
              header: "Late (Mins)",
              render: (row) => formatNumber(row.Late_minutes),
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
