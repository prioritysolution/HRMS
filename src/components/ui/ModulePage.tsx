"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { GenericAddModal } from "@/components/modals/GenericAddModal";
import { useI18n } from "@/i18n";
import { getEmptyIconByTitle } from "@/lib/module-icons";
import { getRowStatusKey } from "@/lib/row-status";

type Stat = {
  title: string;
  value: string;
  change: string;
  hint: string;
  description: string;
  tone: "primary" | "info" | "success" | "warning" | "danger" | "orange";
  icon: "users" | "userPlus" | "trendingDown" | "briefcase" | "clock" | "calendar";
  positive?: boolean;
};

type Row = {
  primary: string;
  secondary?: string;
  avatar?: string;
  c1: string;
  c2: string;
  c3: string;
  status: string;
};

type ModulePageProps = {
  title: string;
  section: string;
  stats?: Stat[];
  actionLabel?: string;
  columns?: [string, string, string];
  rows: Row[];
  children?: React.ReactNode;
  modalTitle?: string;
  showRowActions?: boolean;
  onRowEdit?: (row: Row) => void;
  onRowDelete?: (row: Row) => void | Promise<void>;
  deleteConfirmTitle?: string;
};

export function ModulePage({
  title,
  section,
  stats,
  actionLabel,
  columns = ["Detail", "Owner", "Updated"],
  rows,
  children,
  modalTitle,
  showRowActions = true,
  onRowEdit,
  onRowDelete,
  deleteConfirmTitle,
}: ModulePageProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [tableRows, setTableRows] = useState(rows);
  const resolvedActionLabel = actionLabel ?? t("common.addNew");

  useEffect(() => {
    setTableRows(rows);
  }, [rows]);

  const handleEdit = (row: Row) => {
    if (onRowEdit) {
      onRowEdit(row);
      return;
    }
    setEditOpen(true);
  };

  const handleDelete = async (row: Row) => {
    if (onRowDelete) {
      await onRowDelete(row);
    }
    setTableRows((prev) => prev.filter((item) => item !== row));
  };

  const handleActivate = async (row: Row) => {
    const statusKey = getRowStatusKey(row);
    setTableRows((prev) =>
      prev.map((item) => (item === row ? { ...item, [statusKey]: "Active" } : item)),
    );
  };

  return (
    <>
      <PageHeader title={title} section={section} hideTitle />
      <div className="container-fluid">
        {stats && (
          <div className="stat-grid mb-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        )}
        {children}
        <DataTable
          title={title}
          searchPlaceholder={t("common.table.searchModule", {
            title: title.toLowerCase(),
          })}
          actionLabel={resolvedActionLabel}
          onAction={() => setOpen(true)}
          showRowActions={showRowActions}
          statusToggle
          onRowEdit={handleEdit}
          onRowDelete={handleDelete}
          onRowActivate={handleActivate}
          deleteConfirmTitle={
            deleteConfirmTitle ??
            t("common.dialog.deleteTitle", { title: title.toLowerCase() })
          }
          activateConfirmTitle={t("common.dialog.activateTitle", {
            title: title.toLowerCase(),
          })}
          rows={tableRows}
          searchKeys={["primary", "secondary", "c1", "c2", "c3", "status"]}
          filterFields={[{ key: "status", label: t("common.status") }]}
          emptyStateIcon={getEmptyIconByTitle(title)}
          columns={[
            {
              key: "primary",
              header: title.includes("Companies") ? t("common.company") : t("common.name"),
              render: (row) => (
                <PersonCell
                  name={row.primary}
                  subtitle={row.secondary}
                  avatar={row.avatar}
                />
              ),
            },
            { key: "c1", header: columns[0], render: (row) => row.c1 },
            { key: "c2", header: columns[1], render: (row) => row.c2 },
            { key: "c3", header: columns[2], render: (row) => row.c3 },
            {
              key: "status",
              header: t("common.status"),
              render: (row) => <SoftStatus value={row.status} />,
            },
          ]}
        />
      </div>
      <GenericAddModal
        open={open}
        onClose={() => setOpen(false)}
        title={modalTitle || resolvedActionLabel}
      />
      <GenericAddModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("common.dialog.editTitle", { title })}
        submitLabel={t("common.saveContinue")}
      />
    </>
  );
}
