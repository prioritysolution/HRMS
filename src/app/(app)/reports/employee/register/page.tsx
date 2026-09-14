"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
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
  designationService,
  employeeRegisterReportService,
  employmentTypeService,
} from "@/lib/api";
import { formatDateDisplay } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import type {
  ReportExportColumn,
  ReportFieldGroup,
} from "@/lib/report-export";
import type { HrmsRow } from "@/types/hrms";

const MODULE_ID = "employee-register";

const EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: "Employee_code", header: "Employee Code" },
  { key: "Display_name", header: "Employee Name" },
  { key: "Mobile", header: "Mobile" },
  { key: "Email", header: "Email" },
  { key: "Work_Email", header: "Work Email" },
  { key: "Branch_Name", header: "Branch" },
  { key: "Dept_Name", header: "Department" },
  { key: "Desig_Name", header: "Designation" },
  { key: "Category_name", header: "Category" },
  { key: "Date_of_joining", header: "Date of Joining" },
  { key: "Employment_status_name", header: "Employment Status" },
  { key: "Status", header: "Status" },
  { key: "Bank_name", header: "Bank" },
  { key: "Account_number", header: "Account No." },
  { key: "Ifsc_code", header: "IFSC" },
  { key: "Pf_no", header: "PF No." },
  { key: "Uan_no", header: "UAN" },
  { key: "Esi_no", header: "ESI No." },
  { key: "IdCard_No", header: "ID Card No." },
  { key: "Identifications", header: "Identifications" },
  { key: "Active_asset_codes", header: "Active Assets" },
];

const PDF_FIELD_GROUPS: ReportFieldGroup[] = [
  {
    title: "Contact",
    fields: [
      { key: "Mobile", header: "Mobile" },
      { key: "Email", header: "Email" },
      { key: "Work_Email", header: "Work Email" },
      { key: "IdCard_No", header: "ID Card No." },
    ],
  },
  {
    title: "Organization",
    fields: [
      { key: "Branch_Name", header: "Branch" },
      { key: "Dept_Name", header: "Department" },
      { key: "Desig_Name", header: "Designation" },
      { key: "Category_name", header: "Category" },
    ],
  },
  {
    title: "Employment",
    fields: [
      { key: "Date_of_joining", header: "Date of Joining" },
      { key: "Employment_status_name", header: "Employment Status" },
      { key: "Status", header: "Status" },
      { key: "Identifications", header: "Identifications", fullWidth: true },
    ],
  },
  {
    title: "Bank Details",
    fields: [
      { key: "Bank_name", header: "Bank" },
      { key: "Account_number", header: "Account No." },
      { key: "Ifsc_code", header: "IFSC" },
    ],
  },
  {
    title: "Compliance",
    fields: [
      { key: "Pf_no", header: "PF No." },
      { key: "Uan_no", header: "UAN" },
      { key: "Esi_no", header: "ESI No." },
      { key: "Active_asset_codes", header: "Active Assets", fullWidth: true },
    ],
  },
];

/** Convert "A | B | C" style values into one-per-line text for Excel/PDF. */
function pipeToLineBreaks(value: unknown): string {
  return String(value ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

function toExportRows(rows: HrmsRow[]): HrmsRow[] {
  return rows.map((row) => {
    const joinRaw = String(row.Date_of_joining ?? "").trim();
    const joinDisplay = formatDateDisplay(joinRaw) || joinRaw;
    return {
      ...row,
      Date_of_joining: joinDisplay,
      Identifications: pipeToLineBreaks(row.Identifications),
    };
  });
}

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export default function EmployeeRegisterPage() {
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();

  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [branchOptions, setBranchOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [deptOptions, setDeptOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [desigOptions, setDesigOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [categoryOptions, setCategoryOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employeeRegisterReportService.list();
      setRows(data);
      setFilteredRows(data);
    } catch (error) {
      setRows([]);
      setFilteredRows([]);
      toast.error({
        title: "Unable to load employee register",
        message:
          error instanceof ApiError
            ? error.message
            : "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial/async data load
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      try {
        const [branches, departments, designations, empTypes] = await Promise.all([
          branchService.list({ status: 1 }),
          departmentService.list({ status: 1 }),
          designationService.list({ status: 1 }),
          employmentTypeService.list({ status: 1 }),
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
        setDesigOptions(
          designations
            .map((row) => ({
              value: String(row.Desig_Id ?? row.id ?? ""),
              label: String(row.Desig_Name ?? ""),
            }))
            .filter((option) => option.value && option.label),
        );
        setCategoryOptions(
          empTypes
            .map((row) => ({
              value: String(row.Emp_type_id ?? row.id ?? ""),
              label: String(row.Type_name ?? row.Emp_type_name ?? ""),
            }))
            .filter((option) => option.value && option.label),
        );
      } catch {
        if (!cancelled) {
          setBranchOptions([]);
          setDeptOptions([]);
          setDesigOptions([]);
          setCategoryOptions([]);
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
      { key: "Desig_Id", label: "Designation", options: desigOptions },
      { key: "Emp_type_id", label: "Category", options: categoryOptions },
      {
        key: "Status",
        label: "Status",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
        defaultValue: "Active",
      },
    ],
    [branchOptions, categoryOptions, deptOptions, desigOptions],
  );

  const filterSummary = useMemo(() => {
    const count = filteredRows.length;
    return `${count} employee${count === 1 ? "" : "s"} (as per current filters)`;
  }, [filteredRows.length]);

  const exportRows = useMemo(
    () => toExportRows(filteredRows),
    [filteredRows],
  );

  const handleFilteredRowsChange = useCallback((next: HrmsRow[]) => {
    setFilteredRows(next);
  }, []);

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        <DataTable
          title={config.title}
          searchPlaceholder="Search employee register..."
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          showRowActions={false}
          onFilteredRowsChange={handleFilteredRowsChange}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle="No employees found"
          emptyStateMessage="Try adjusting filters or search to find employees."
          extraActions={
            <ReportExportButtons
              title="Employee Register Report"
              rows={exportRows}
              columns={EXPORT_COLUMNS}
              filterSummary={filterSummary}
              pdfLayout="cards"
              fieldGroups={PDF_FIELD_GROUPS}
              cardTitle={{
                primaryKey: "Display_name",
                secondaryKey: "Employee_code",
                badgeKey: "Status",
              }}
              sheetName="Employee Register"
              disabled={loading}
              emptyMessage="No employee records match the current filters."
              successMessage="Download started for the filtered employee register."
            />
          }
          columns={[
            {
              key: "Display_name",
              header: "Employee",
              render: (row) => (
                <PersonCell
                  name={String(row.Display_name ?? "")}
                  subtitle={String(row.Employee_code ?? "")}
                />
              ),
            },
            {
              key: "Mobile",
              header: "Mobile",
              render: (row) => formatCell(row.Mobile),
            },
            {
              key: "Email",
              header: "Email",
              render: (row) => formatCell(row.Email || row.Work_Email),
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
              key: "Desig_Name",
              header: "Designation",
              render: (row) => formatCell(row.Desig_Name),
            },
            {
              key: "Category_name",
              header: "Category",
              render: (row) => formatCell(row.Category_name),
            },
            {
              key: "Date_of_joining",
              header: "Join Date",
              render: (row) =>
                formatDateDisplay(String(row.Date_of_joining ?? "")) ||
                formatCell(row.Date_of_joining),
            },
            {
              key: "Status",
              header: "Status",
              render: (row) => <SoftStatus value={String(row.Status ?? "")} />,
            },
            {
              key: "Active_asset_codes",
              header: "Assets",
              render: (row) => formatCell(row.Active_asset_codes),
            },
          ]}
        />
      </div>
    </>
  );
}
