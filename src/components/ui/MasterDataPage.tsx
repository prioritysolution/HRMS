"use client";

import { useMemo, useState } from "react";
import { getHrmsModule, getModuleFilterFields } from "@/config/hrms-modules";
import { getHrmsMockRows } from "@/data/hrms-mock";
import { formatDateDisplay } from "@/lib/date-utils";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, PersonCell, SoftStatus, type Column } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { getRowLabel } from "@/lib/row-label";
import type { HrmsRow, TableColumn } from "@/types/hrms";

type MasterDataPageProps = {
  moduleId: string;
  onRowEdit?: (row: HrmsRow) => void;
};

function formatCellValue(value: HrmsRow[string], type?: TableColumn["type"]): string {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "boolean") return value === true || value === "true" || value === 1 ? "Yes" : "No";
  if (type === "currency") return `₹${Number(value).toLocaleString("en-IN")}`;
  if (type === "date") return formatDateDisplay(String(value));
  return String(value);
}

function formatStatus(value: HrmsRow[string]): string {
  const text = String(value ?? "");
  if (!text) return "Active";
  if (text === "ACTIVE") return "Active";
  if (text === "INACTIVE") return "Inactive";
  return text;
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
        render: (row) => <SoftStatus value={formatStatus(row[column.key])} />,
      };
    }

    return {
      key: column.key,
      header: column.header,
      render: (row) => formatCellValue(row[column.key], column.type),
    };
  });
}

export function MasterDataPage({ moduleId, onRowEdit }: MasterDataPageProps) {
  const config = getHrmsModule(moduleId);
  const toast = useToast();
  const [rows, setRows] = useState<HrmsRow[]>(() => getHrmsMockRows(moduleId));
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const columns = useMemo(() => buildColumns(config.columns), [config.columns]);
  const filterFields = useMemo(() => getModuleFilterFields(config), [config]);

  const handleEdit = (row: HrmsRow) => {
    if (onRowEdit) {
      onRowEdit(row);
      return;
    }
    setEditRow(row);
  };

  const handleDelete = async (row: HrmsRow) => {
    setRows((prev) => prev.filter((item) => item.id !== row.id));
  };

  const handleSave = (values: HrmsRow, mode: "add" | "edit") => {
    setRows((prev) => {
      const exists = prev.some((row) => row.id === values.id);
      if (exists) {
        return prev.map((row) => (row.id === values.id ? { ...row, ...values } : row));
      }
      return [...prev, values];
    });

    const label = String(values[config.nameKey] ?? getRowLabel(values));
    toast.success({
      title: mode === "edit" ? "Updated successfully" : "Saved successfully",
      message: `"${label}" has been ${mode === "edit" ? "updated" : "added"}.`,
    });
  };

  const deleteName = (row: HrmsRow) => {
    const name = row[config.nameKey];
    if (name) return String(name);
    return getRowLabel(row);
  };

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        <DataTable
          title={config.title}
          searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
          actionLabel={config.actionLabel}
          onAction={() => setAddOpen(true)}
          showRowActions
          onRowEdit={handleEdit}
          onRowDelete={handleDelete}
          deleteConfirmTitle={`Delete ${config.title.toLowerCase()}?`}
          rows={rows}
          columns={columns}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          getDeleteLabel={deleteName}
          emptyStateIcon={getModuleEmptyIcon(moduleId)}
        />
      </div>

      <MasterDataModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={config.actionLabel}
        fields={config.formFields}
        size={config.modalSize}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        title={`Edit ${config.title}`}
        fields={config.formFields}
        size={config.modalSize}
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}
