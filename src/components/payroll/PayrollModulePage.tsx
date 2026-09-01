"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  DataTable,
  PersonCell,
  SoftStatus,
  type Column,
} from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import {
  getHrmsModule,
  getModuleFilterFields,
  getModuleFormFields,
} from "@/config/hrms-modules";
import { getHrmsMockRows } from "@/data/hrms-mock";
import { formatDateDisplay } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import {
  enrichPayrollFinalizationRow,
  enrichPayrollProcessingRow,
  enrichPayslipBankRow,
  enrichSalaryComponentRow,
  enrichSalaryRevisionRow,
  enrichSalaryStructureRow,
  getActiveSalaryComponents,
  withComponentOptions,
  withEmployeeSelectOptions,
  withStructureOptions,
} from "@/lib/payroll-module-utils";
import type { HrmsRow, TableColumn } from "@/types/hrms";

export type PayrollStatCard = {
  title: string;
  value: (rows: HrmsRow[]) => string;
  change: (rows: HrmsRow[]) => string;
  hint: string;
  description: string;
  tone: "primary" | "info" | "success" | "warning" | "danger" | "orange";
  icon: "users" | "userPlus" | "clock" | "calendar" | "briefcase" | "trendingDown";
  positive?: boolean;
};

type PayrollModulePageProps = {
  moduleId: string;
  stats?: PayrollStatCard[];
  modalSubtitle?: string;
  emptyStateMessage?: string;
  submitLabel?: string;
};

function formatCellValue(value: HrmsRow[string], type?: TableColumn["type"]): string {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "boolean") return value === true || value === "true" || value === 1 ? "Yes" : "No";
  if (type === "currency") return `₹${Number(value).toLocaleString("en-IN")}`;
  if (type === "date") return formatDateDisplay(String(value)) || "—";
  return String(value);
}

function buildColumns(configColumns: TableColumn[]): Column<HrmsRow>[] {
  return configColumns.map((column) => {
    if (column.type === "person") {
      return {
        key: column.key,
        header: column.header,
        render: (row) => (
          <PersonCell
            name={String(row[column.key] ?? "—")}
            subtitle={column.subtitleKey ? String(row[column.subtitleKey] ?? "") : undefined}
            avatar={column.avatarKey ? String(row[column.avatarKey] ?? "") : undefined}
          />
        ),
      };
    }

    if (column.type === "status") {
      return {
        key: column.key,
        header: column.header,
        render: (row) => <SoftStatus value={String(row[column.key] ?? "—")} />,
      };
    }

    return {
      key: column.key,
      header: column.header,
      render: (row) => formatCellValue(row[column.key], column.type),
    };
  });
}

function enrichPayrollRow(
  moduleId: string,
  values: HrmsRow,
  employees: HrmsRow[],
  components: HrmsRow[],
  structures: HrmsRow[],
): HrmsRow {
  switch (moduleId) {
    case "payroll-salary-components":
      return enrichSalaryComponentRow(values);
    case "payroll-salary-structure":
      return enrichSalaryStructureRow(values, components);
    case "payroll-salary-revision":
      return enrichSalaryRevisionRow(values, employees);
    case "payroll-processing":
      return enrichPayrollProcessingRow(values);
    case "payroll-finalization":
      return enrichPayrollFinalizationRow(values);
    case "payroll-payslip-bank":
      return enrichPayslipBankRow(values, employees);
    default:
      return values;
  }
}

function usesEmployeeSelect(moduleId: string): boolean {
  return ["payroll-salary-revision", "payroll-payslip-bank"].includes(moduleId);
}

function usesComponentOptions(moduleId: string): boolean {
  return moduleId === "payroll-salary-structure";
}

function usesStructureOptions(moduleId: string): boolean {
  return moduleId === "payroll-salary-revision";
}

export function PayrollModulePage({
  moduleId,
  stats,
  modalSubtitle,
  emptyStateMessage,
  submitLabel,
}: PayrollModulePageProps) {
  const config = getHrmsModule(moduleId);
  const toast = useToast();
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const employees = useMemo(() => getHrmsMockRows("employees"), []);
  const components = useMemo(() => getActiveSalaryComponents(), []);
  const structures = useMemo(() => getHrmsMockRows("payroll-salary-structure"), []);
  const baseFormFields = useMemo(() => getModuleFormFields(config), [config]);
  const columns = useMemo(() => buildColumns(config.columns), [config.columns]);
  const filterFields = useMemo(() => getModuleFilterFields(config), [config]);

  const loadRows = useCallback(() => {
    setLoading(true);
    setRows(getHrmsMockRows(moduleId));
    setLoading(false);
  }, [moduleId]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const modalFields = useMemo(() => {
    let fields = baseFormFields;
    if (usesEmployeeSelect(moduleId)) {
      fields = withEmployeeSelectOptions(fields, employees);
    }
    if (usesComponentOptions(moduleId)) {
      fields = withComponentOptions(fields, components);
    }
    if (usesStructureOptions(moduleId)) {
      fields = withStructureOptions(fields, structures);
    }
    return fields;
  }, [baseFormFields, components, employees, moduleId, structures]);

  const modalSections = config.formSections;

  const handleSave = async (values: HrmsRow, mode: "add" | "edit") => {
    const saved = enrichPayrollRow(moduleId, values, employees, components, structures);

    setRows((prev) => {
      const exists = prev.some((row) => row.id === saved.id);
      if (exists) {
        return prev.map((row) => (row.id === saved.id ? saved : row));
      }
      return [saved, ...prev];
    });

    const label = String(
      saved[config.nameKey] ??
        saved.Component_name ??
        saved.Structure_name ??
        saved.Employee_name ??
        saved.Payroll_month ??
        saved.Batch_ref ??
        "Record",
    );
    toast.success({
      title: mode === "edit" ? `${config.title} updated` : `${config.title} saved`,
      message: `"${label}" has been ${mode === "edit" ? "updated" : "added"}.`,
    });

    if (mode === "edit") {
      setEditRow(null);
    } else {
      setAddOpen(false);
    }
  };

  const deleteLabel = (row: HrmsRow) =>
    String(
      row[config.nameKey] ??
        row.Component_name ??
        row.Structure_name ??
        row.Employee_name ??
        row.Payroll_month ??
        row.Batch_ref ??
        "this record",
    );

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        {stats && stats.length > 0 ? (
          <div className="stat-grid mb-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value(rows)}
                change={stat.change(rows)}
                hint={stat.hint}
                description={stat.description}
                tone={stat.tone}
                icon={stat.icon}
                positive={stat.positive}
              />
            ))}
          </div>
        ) : null}

        <DataTable
          title={config.title}
          searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
          actionLabel={config.actionLabel}
          onAction={() => setAddOpen(true)}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          onRowEdit={setEditRow}
          showRowActions
          deleteConfirmTitle={`Remove ${config.title.toLowerCase()} record?`}
          deleteConfirmMessage='Remove "{name}" from the list?'
          getDeleteLabel={deleteLabel}
          onRowDelete={(row) => {
            setRows((prev) => prev.filter((item) => item.id !== row.id));
            toast.success({
              title: "Record removed",
              message: `"${deleteLabel(row)}" was removed.`,
            });
          }}
          emptyStateIcon={getModuleEmptyIcon(moduleId)}
          emptyStateTitle={`No ${config.title.toLowerCase()} records yet`}
          emptyStateMessage={
            emptyStateMessage ??
            `Use "${config.actionLabel ?? "Add"}" to create the first record.`
          }
          columns={columns}
        />
      </div>

      <MasterDataModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={config.actionLabel ?? `Add ${config.title}`}
        subtitle={modalSubtitle}
        submitLabel={submitLabel ?? "Save"}
        fields={modalSections ? undefined : modalFields}
        sections={modalSections}
        size={config.modalSize}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title={`Edit ${config.title}`}
        subtitle={modalSubtitle}
        submitLabel="Save Changes"
        fields={modalSections ? undefined : modalFields}
        sections={modalSections}
        size={config.modalSize}
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}
