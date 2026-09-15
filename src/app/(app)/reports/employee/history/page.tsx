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
  employeeServiceHistoryReportService,
} from "@/lib/api";
import { formatDateDisplay } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import type {
  ReportExportColumn,
  ReportFieldGroup,
} from "@/lib/report-export";
import type { HrmsRow } from "@/types/hrms";

const MODULE_ID = "employee-service-history-report";
const SERVICE_HISTORY_OPT_GRP_ID = 6;

const EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: "Employee_code", header: "Employee Code" },
  { key: "Display_name", header: "Employee Name" },
  { key: "Branch_Name", header: "Branch" },
  { key: "Dept_Name", header: "Department" },
  { key: "Desig_Name", header: "Designation" },
  { key: "Emp_type_name", header: "Category" },
  { key: "Event_type", header: "Event" },
  { key: "Effective_date", header: "Effective Date" },
  { key: "Old_value", header: "Previous Value" },
  { key: "New_value", header: "New Value" },
  { key: "Status", header: "Status" },
  { key: "Remarks", header: "Remarks" },
  { key: "Created_at", header: "Created At" },
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
      { key: "Emp_type_name", header: "Category" },
    ],
  },
  {
    title: "Event",
    fields: [
      { key: "Event_type", header: "Event Type" },
      { key: "Effective_date", header: "Effective Date" },
      { key: "Old_value", header: "Previous Value" },
      { key: "New_value", header: "New Value" },
      { key: "Status", header: "Status" },
      { key: "Created_at", header: "Created At" },
    ],
  },
  {
    title: "Remarks",
    fields: [{ key: "Remarks", header: "Remarks", fullWidth: true }],
  },
];

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export default function EmployeeServiceHistoryReportPage() {
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();

  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [branchOptions, setBranchOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [deptOptions, setDeptOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [eventTypeOptions, setEventTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employeeServiceHistoryReportService.list({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setRows(data);
      setFilteredRows(data);
    } catch (error) {
      setRows([]);
      setFilteredRows([]);
      toast.error({
        title: "Unable to load service history",
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
        const [branches, departments, eventTypes] = await Promise.all([
          branchService.list({ status: 1 }),
          departmentService.list({ status: 1 }),
          applOptionService.list({
            opt_grp_id: SERVICE_HISTORY_OPT_GRP_ID,
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
        setEventTypeOptions(applOptionsToSelectOptions(eventTypes));
      } catch {
        if (!cancelled) {
          setBranchOptions([]);
          setDeptOptions([]);
          setEventTypeOptions([]);
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
      { key: "Event_type_code", label: "Event", options: eventTypeOptions },
      {
        key: "Employee_status",
        label: "Status",
        options: [
          { value: "1", label: "Active" },
          { value: "0", label: "Inactive" },
        ],
      },
    ],
    [branchOptions, deptOptions, eventTypeOptions],
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
          searchPlaceholder="Search service history..."
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          showRowActions={false}
          onFilteredRowsChange={handleFilteredRowsChange}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle="No service history found"
          emptyStateMessage="Try adjusting filters or date range to find records."
          filterExtra={
            <>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="service-history-from">
                  From
                </label>
                <input
                  id="service-history-from"
                  type="date"
                  className="form-control form-control-sm"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="service-history-to">
                  To
                </label>
                <input
                  id="service-history-to"
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
              title="Employee Service History Report"
              rows={filteredRows}
              columns={EXPORT_COLUMNS}
              filterSummary={filterSummary}
              pdfLayout="cards"
              fieldGroups={PDF_FIELD_GROUPS}
              cardTitle={{
                primaryKey: "Display_name",
                secondaryKey: "Employee_code",
                badgeKey: "Event_type",
              }}
              sheetName="Service History"
              disabled={loading}
              emptyMessage="No service history records match the current filters."
              successMessage="Download started for the filtered service history report."
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
              key: "Event_type",
              header: "Event",
              render: (row) => formatCell(row.Event_type || row.Event_type_name),
            },
            {
              key: "Effective_date",
              header: "Effective Date",
              render: (row) =>
                formatDateDisplay(String(row.Effective_date_raw ?? row.Effective_date ?? "")) ||
                formatCell(row.Effective_date),
            },
            {
              key: "Old_value",
              header: "Previous",
              render: (row) => formatCell(row.Old_value),
            },
            {
              key: "New_value",
              header: "New",
              render: (row) => formatCell(row.New_value),
            },
            {
              key: "Status",
              header: "Status",
              render: (row) => (
                <SoftStatus
                  value={String(row.Status ?? row.Employee_status_name ?? "")}
                />
              ),
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
