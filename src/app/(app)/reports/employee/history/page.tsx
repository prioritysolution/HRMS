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
  employeeService,
  employeeServiceHistoryReportService,
} from "@/lib/api";
import { formatDateDisplay } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { useI18n, translateHrmsLookup } from "@/i18n";
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
  const { language, t } = useI18n();
  const config = getHrmsModule(MODULE_ID);
  const pageTitle = translateHrmsLookup(language, "titles", config.title);
  const pageSection = translateHrmsLookup(language, "sections", config.section);
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
  const [employees, setEmployees] = useState<HrmsRow[]>([]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, HrmsRow>();
    employees.forEach((emp) => {
      const id = String(emp.Employee_id ?? emp.id ?? "").trim();
      const code = String(emp.Employee_code ?? "").trim();
      if (id && id !== "0") map.set(id, emp);
      if (code) map.set(code.toLowerCase(), emp);
    });
    return map;
  }, [employees]);

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
        title: t("reports.employeeHistory.loadError"),
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
        const [branches, departments, eventTypes, employeeList] = await Promise.all([
          branchService.list({ status: 1 }),
          departmentService.list({ status: 1 }),
          applOptionService.list({
            opt_grp_id: SERVICE_HISTORY_OPT_GRP_ID,
            is_active: 1,
          }),
          employeeService.list({ status: 1 }),
        ]);
        if (cancelled) return;
        setEmployees(employeeList);

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
      {
        key: "Branch_Id",
        label: translateHrmsLookup(language, "labels", "Branch"),
        options: branchOptions,
      },
      {
        key: "Dept_Id",
        label: translateHrmsLookup(language, "labels", "Department"),
        options: deptOptions,
      },
      {
        key: "Event_type_code",
        label: translateHrmsLookup(language, "labels", "Event"),
        options: eventTypeOptions,
      },
      {
        key: "Employee_status",
        label: translateHrmsLookup(language, "labels", "Status"),
        options: [
          {
            value: "1",
            label: translateHrmsLookup(language, "labels", "Active"),
          },
          {
            value: "0",
            label: translateHrmsLookup(language, "labels", "Inactive"),
          },
        ],
      },
    ],
    [branchOptions, deptOptions, eventTypeOptions, language],
  );

  const filterSummary = useMemo(() => {
    const count = filteredRows.length;
    const base =
      count === 1
        ? t("reports.common.filterSummaryRecord", { count })
        : t("reports.common.filterSummaryRecords", { count });
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
          searchPlaceholder={t("reports.employeeHistory.searchPlaceholder")}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          showRowActions={false}
          onFilteredRowsChange={handleFilteredRowsChange}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle={t("reports.employeeHistory.emptyTitle")}
          emptyStateMessage={t("reports.employeeHistory.empty")}
          filterExtra={
            <>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="service-history-from">
                  {translateHrmsLookup(language, "labels", "From")}
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
                  {translateHrmsLookup(language, "labels", "To")}
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
              title={t("reports.employeeHistory.exportTitle")}
              rows={filteredRows}
              columns={exportColumns}
              filterSummary={filterSummary}
              pdfLayout="cards"
              fieldGroups={pdfFieldGroups}
              cardTitle={{
                primaryKey: "Display_name",
                secondaryKey: "Employee_code",
                badgeKey: "Event_type",
              }}
              sheetName={t("reports.employeeHistory.sheetName")}
              disabled={loading}
              emptyMessage={t("reports.employeeHistory.emptyExport")}
              successMessage={t("reports.employeeHistory.successExport")}
            />
          }
          columns={[
            {
              key: "Display_name",
              header: translateHrmsLookup(language, "headers", "Employee"),
              render: (row) => {
                const empId = String(row.Employee_id ?? "").trim();
                const empCode = String(row.Employee_code ?? "").trim().toLowerCase();
                const emp = employeeMap.get(empId) || employeeMap.get(empCode);
                const avatar =
                  row.Photo_path ||
                  (row as any).photo_path ||
                  (row as any).avatar ||
                  emp?.Photo_path ||
                  (emp as any)?.photo_path ||
                  (emp as any)?.avatar;

                return (
                  <PersonCell
                    name={String(row.Display_name ?? row.Employee_name ?? emp?.Display_name ?? emp?.Employee_name ?? "")}
                    subtitle={String(row.Employee_code ?? emp?.Employee_code ?? "")}
                    avatar={avatar}
                  />
                );
              },
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
              key: "Event_type",
              header: translateHrmsLookup(language, "headers", "Event"),
              render: (row) => formatCell(row.Event_type || row.Event_type_name),
            },
            {
              key: "Effective_date",
              header: translateHrmsLookup(language, "headers", "Effective Date"),
              render: (row) =>
                formatDateDisplay(String(row.Effective_date_raw ?? row.Effective_date ?? "")) ||
                formatCell(row.Effective_date),
            },
            {
              key: "Old_value",
              header: translateHrmsLookup(language, "headers", "Previous"),
              render: (row) => formatCell(row.Old_value),
            },
            {
              key: "New_value",
              header: translateHrmsLookup(language, "headers", "New"),
              render: (row) => formatCell(row.New_value),
            },
            {
              key: "Status",
              header: translateHrmsLookup(language, "headers", "Status"),
              render: (row) => (
                <SoftStatus
                  value={String(row.Status ?? row.Employee_status_name ?? "")}
                />
              ),
            },
            {
              key: "Remarks",
              header: translateHrmsLookup(language, "headers", "Remarks"),
              render: (row) => <ClampedText text={String(row.Remarks ?? "")} />,
            },
          ]}
        />
      </div>
    </>
  );
}
