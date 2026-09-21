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
import { useI18n, translateHrmsLookup } from "@/i18n";
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
  const { language, t } = useI18n();
  const config = getHrmsModule(MODULE_ID);
  const pageTitle = translateHrmsLookup(language, "titles", config.title);
  const pageSection = translateHrmsLookup(language, "sections", config.section);
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
      const data = await employeeRegisterReportService.list();
      setRows(data);
      setFilteredRows(data);
    } catch (error) {
      setRows([]);
      setFilteredRows([]);
      toast.error({
        title: t("reports.employeeRegister.loadError"),
        message:
          error instanceof ApiError
            ? error.message
            : t("reports.common.connectionError"),
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

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
        key: "Desig_Id",
        label: translateHrmsLookup(language, "labels", "Designation"),
        options: desigOptions,
      },
      {
        key: "Emp_type_id",
        label: translateHrmsLookup(language, "labels", "Category"),
        options: categoryOptions,
      },
      {
        key: "Status",
        label: translateHrmsLookup(language, "labels", "Status"),
        options: [
          {
            value: "Active",
            label: translateHrmsLookup(language, "labels", "Active"),
          },
          {
            value: "Inactive",
            label: translateHrmsLookup(language, "labels", "Inactive"),
          },
        ],
        defaultValue: "Active",
      },
    ],
    [branchOptions, categoryOptions, deptOptions, desigOptions, language],
  );

  const filterSummary = useMemo(() => {
    const count = filteredRows.length;
    return count === 1
      ? t("reports.common.filterSummaryEmployee", { count })
      : t("reports.common.filterSummaryEmployees", { count });
  }, [filteredRows.length, t]);

  const exportRows = useMemo(
    () => toExportRows(filteredRows),
    [filteredRows],
  );

  const handleFilteredRowsChange = useCallback((next: HrmsRow[]) => {
    setFilteredRows(next);
  }, []);

  return (
    <>
      <PageHeader title={pageTitle} section={pageSection} hideTitle />
      <div className="container-fluid">
        <DataTable
          title={pageTitle}
          searchPlaceholder={t("reports.employeeRegister.searchPlaceholder")}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          showRowActions={false}
          onFilteredRowsChange={handleFilteredRowsChange}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle={t("reports.employeeRegister.emptyTitle")}
          emptyStateMessage={t("reports.employeeRegister.empty")}
          extraActions={
            <ReportExportButtons
              title={t("reports.employeeRegister.exportTitle")}
              rows={exportRows}
              columns={exportColumns}
              filterSummary={filterSummary}
              pdfLayout="cards"
              fieldGroups={pdfFieldGroups}
              cardTitle={{
                primaryKey: "Display_name",
                secondaryKey: "Employee_code",
                badgeKey: "Status",
              }}
              sheetName={t("reports.employeeRegister.sheetName")}
              disabled={loading}
              emptyMessage={t("reports.employeeRegister.emptyExport")}
              successMessage={t("reports.employeeRegister.successExport")}
            />
          }
          columns={[
            {
              key: "Display_name",
              header: translateHrmsLookup(language, "headers", "Employee"),
              render: (row) => (
                <PersonCell
                  name={String(row.Display_name ?? "")}
                  subtitle={String(row.Employee_code ?? "")}
                  avatar={row.Photo_path || (row as any).photo_path || (row as any).avatar}
                />
              ),
            },
            {
              key: "Mobile",
              header: translateHrmsLookup(language, "headers", "Mobile"),
              render: (row) => formatCell(row.Mobile),
            },
            {
              key: "Email",
              header: translateHrmsLookup(language, "headers", "Email"),
              render: (row) => formatCell(row.Email || row.Work_Email),
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
              key: "Desig_Name",
              header: translateHrmsLookup(language, "headers", "Designation"),
              render: (row) => formatCell(row.Desig_Name),
            },
            {
              key: "Category_name",
              header: translateHrmsLookup(language, "headers", "Category"),
              render: (row) => formatCell(row.Category_name),
            },
            {
              key: "Date_of_joining",
              header: translateHrmsLookup(language, "headers", "Join Date"),
              render: (row) =>
                formatDateDisplay(String(row.Date_of_joining ?? "")) ||
                formatCell(row.Date_of_joining),
            },
            {
              key: "Status",
              header: translateHrmsLookup(language, "headers", "Status"),
              render: (row) => <SoftStatus value={String(row.Status ?? "")} />,
            },
            {
              key: "Active_asset_codes",
              header: translateHrmsLookup(language, "headers", "Assets"),
              render: (row) => formatCell(row.Active_asset_codes),
            },
          ]}
        />
      </div>
    </>
  );
}
