"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n, translateHrmsLookup } from "@/i18n";
import { getHrmsModule, getModuleFormFields } from "@/config/hrms-modules";
import {
  ApiError,
  assetService,
  employeeAssetService,
  employeeService,
} from "@/lib/api";
import { queueAuditLog, resolveAuditRecordId } from "@/lib/audit-log";
import { formatDateDisplay, parseDateToIso } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { formatEmployeeOptionLabel } from "@/lib/attendance-module-utils";
import type { FormField, HrmsRow } from "@/types/hrms";

const MODULE_ID = "asset-allocation";

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function toIsoDate(value: HrmsRow[string]): string {
  return parseDateToIso(String(value ?? "").trim());
}

function isCurrentlyAllocated(row: HrmsRow): boolean {
  const status = Number(row.Status ?? 1);
  if (status === 0) return false;
  return !toIsoDate(row.Return_date);
}

function displayStatus(row: HrmsRow): string {
  return String(row.Allocation_status ?? "Allocated");
}

function selectOptionsFromEmployees(employees: HrmsRow[]): Array<{ value: string; label: string }> {
  return employees
    .map((row) => {
      const id = String(row.Employee_id ?? row.id ?? "").trim();
      if (!id || id === "0") return null;
      const name = String(row.Display_name ?? row.Employee_name ?? "").trim();
      const code = String(row.Employee_code ?? "").trim();
      return { value: id, label: formatEmployeeOptionLabel(code, name) || id };
    })
    .filter((option): option is { value: string; label: string } => option !== null);
}

function selectOptionsFromAssets(
  assets: HrmsRow[],
  allocations: HrmsRow[],
  currentRowId?: string,
): Array<{ value: string; label: string }> {
  const allocatedAssetIds = new Set(
    allocations
      .filter((row) => isCurrentlyAllocated(row) && row.id !== currentRowId)
      .map((row) => String(row.Asset_id ?? "").trim())
      .filter(Boolean),
  );

  return assets
    .map((row) => {
      const id = String(row.Asset_id ?? row.id ?? "").trim();
      if (!id || id === "0") return null;

      const assetStatus = Number(row.Asset_status ?? row.Status ?? 1);
      if (assetStatus === 0) return null;
      if (allocatedAssetIds.has(id)) return null;

      const code = String(row.Asset_code ?? "").trim();
      const typeName = String(row.Asset_type_name ?? row.Asset_type ?? "").trim();
      const serial = String(row.Serial_number ?? "").trim();
      const labelParts = [typeName || code, code && typeName !== code ? `(${code})` : ""]
        .filter(Boolean)
        .join(" ");
      const label = serial ? `${labelParts} · ${serial}` : labelParts || id;

      return { value: id, label };
    })
    .filter((option): option is { value: string; label: string } => option !== null);
}

function withSelectOptions(
  fields: FormField[],
  employees: HrmsRow[],
  assets: HrmsRow[],
  allocations: HrmsRow[],
  currentRowId?: string,
): FormField[] {
  const employeeOptions = selectOptionsFromEmployees(employees);
  const assetOptions = selectOptionsFromAssets(assets, allocations, currentRowId);

  return fields.map((field) => {
    if (field.name === "Employee_id" && employeeOptions.length > 0) {
      return { ...field, options: employeeOptions };
    }
    if (field.name === "Asset_id" && assetOptions.length > 0) {
      return { ...field, options: assetOptions };
    }
    return field;
  });
}

function toFormRow(row: HrmsRow): HrmsRow {
  return {
    ...row,
    Employee_id: String(row.Employee_id ?? ""),
    Asset_id: String(row.Asset_id ?? ""),
  };
}

export default function AssetAllocationPage() {
  const { language, t } = useI18n();
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();
  const pageTitle = translateHrmsLookup(language, "titles", config.title);
  const pageSection = translateHrmsLookup(language, "sections", config.section);
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [employees, setEmployees] = useState<HrmsRow[]>([]);
  const [assets, setAssets] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);
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

  const baseFormFields = useMemo(() => getModuleFormFields(config), [config]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const [allocationRows, employeeRows, assetRows] = await Promise.all([
        employeeAssetService.list(),
        employeeService.list({ status: 1 }),
        assetService.list({ asset_status: 1 }),
      ]);
      setRows(allocationRows);
      setEmployees(employeeRows);
      setAssets(assetRows);
    } catch (error) {
      toast.error({
        title: "Unable to load asset allocations",
        message:
          error instanceof ApiError
            ? error.message
            : "Please check your connection and try again.",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const stats = useMemo(() => {
    const allocated = rows.filter(isCurrentlyAllocated).length;
    const returned = rows.filter(
      (row) => String(row.Allocation_status ?? "").toLowerCase() === "returned",
    ).length;
    const allocatedAssetIds = new Set(
      rows.filter(isCurrentlyAllocated).map((row) => String(row.Asset_id ?? "").trim()),
    );
    const available = assets.filter((asset) => {
      const id = String(asset.Asset_id ?? asset.id ?? "").trim();
      const assetStatus = Number(asset.Asset_status ?? asset.Status ?? 1);
      if (!id || assetStatus === 0) return false;
      return !allocatedAssetIds.has(id);
    }).length;

    return { allocated, returned, available };
  }, [assets, rows]);

  const addFields = useMemo(
    () => withSelectOptions(baseFormFields, employees, assets, rows),
    [assets, baseFormFields, employees, rows],
  );

  const editFields = useMemo(
    () => withSelectOptions(baseFormFields, employees, assets, rows, editRow?.id),
    [assets, baseFormFields, editRow?.id, employees, rows],
  );

  const handleSave = async (values: HrmsRow, mode: "add" | "edit") => {
    try {
      const previous = mode === "edit" ? editRow ?? undefined : undefined;
      const saved =
        mode === "edit" && editRow?.id
          ? await employeeAssetService.update(editRow.id, values)
          : await employeeAssetService.create(values);

      queueAuditLog({
        moduleId: MODULE_ID,
        action: mode === "edit" ? "update" : "create",
        recordId: resolveAuditRecordId(saved as Record<string, unknown>),
        oldValues: previous,
        newValues: saved,
      });

      await loadRows();

      toast.success({
        title: mode === "edit" ? t("employees.assets.updatedToast") : t("employees.assets.allocatedToast"),
        message: t("employees.assets.allocatedMessage", {
          asset: String(saved.Asset_name || saved.Asset_code || ""),
          status: String(saved.Allocation_status ?? "").toLowerCase(),
          employee: String(saved.Employee_name ?? ""),
        }),
      });

      if (mode === "edit") {
        setEditRow(null);
      } else {
        setAddOpen(false);
      }
    } catch (error) {
      toast.error({
        title: mode === "edit" ? t("employees.assets.updateFailed") : t("employees.assets.allocateFailed"),
        message:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : t("employees.assets.formError"),
      });
    }
  };

  const handleDelete = async (row: HrmsRow) => {
    if (!row.id) return;

    try {
      await employeeAssetService.remove(row.id);
      queueAuditLog({
        moduleId: MODULE_ID,
        action: "delete",
        recordId: resolveAuditRecordId(row as Record<string, unknown>),
        oldValues: row,
      });
      await loadRows();
      toast.success({
        title: "Allocation removed",
        message: `"${row.Asset_name ?? row.Asset_code}" allocation for ${row.Employee_name} was removed.`,
      });
    } catch (error) {
      toast.error({
        title: "Delete failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to remove this allocation right now.",
      });
    }
  };

  return (
    <>
      <PageHeader title={pageTitle} section={pageSection} hideTitle />
      <div className="container-fluid">
        <div className="stat-grid mb-4">
          <StatCard
            title={t("employees.assets.allocated")}
            value={String(stats.allocated)}
            change="active"
            hint="issued"
            description={t("employees.assets.allocatedDesc")}
            tone="info"
            icon="briefcase"
          />
          <StatCard
            title={t("employees.assets.available")}
            value={String(stats.available)}
            change="in stock"
            hint="ready"
            description={t("employees.assets.availableDesc")}
            tone="success"
            icon="users"
          />
          <StatCard
            title={t("employees.assets.returned")}
            value={String(stats.returned)}
            change="closed"
            hint="records"
            description={t("employees.assets.returnedDesc")}
            tone="primary"
            icon="clock"
          />
        </div>

        <DataTable
          title={pageTitle}
          searchPlaceholder={t("employees.assets.search")}
          actionLabel={
            config.actionLabel
              ? translateHrmsLookup(language, "actions", config.actionLabel)
              : t("employees.assets.allocateTitle")
          }
          onAction={() => setAddOpen(true)}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={[
            {
              key: "Asset_type",
              label: translateHrmsLookup(language, "labels", "Asset Type"),
            },
            {
              key: "Allocation_status",
              label: translateHrmsLookup(language, "labels", "Status"),
            },
          ]}
          onRowEdit={(row) => setEditRow(toFormRow(row))}
          showRowActions
          deleteConfirmTitle={t("employees.assets.deleteConfirm")}
          deleteConfirmMessage='Remove the allocation of "{name}"? This does not delete the asset from the master list.'
          getDeleteLabel={(row) =>
            String(row.Asset_name ?? row.Asset_code ?? "this allocation")
          }
          onRowDelete={(row) => {
            void handleDelete(row);
          }}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle={t("employees.assets.emptyTitle")}
          emptyStateMessage={t("employees.assets.emptyMessage")}
          columns={[
            {
              key: "Employee_name",
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
                  (emp as any)?.avatar ||
                  (emp as any)?.Photo ||
                  (emp as any)?.Logo_Url;

                return (
                  <PersonCell
                    name={String(row.Employee_name ?? emp?.Employee_name ?? emp?.Display_name ?? "—")}
                    subtitle={String(row.Employee_code ?? emp?.Employee_code ?? "")}
                    avatar={avatar}
                  />
                );
              },
            },
            {
              key: "Asset_code",
              header: translateHrmsLookup(language, "headers", "Asset Code"),
              render: (row) => formatCell(row.Asset_code),
            },
            {
              key: "Asset_name",
              header: translateHrmsLookup(language, "headers", "Asset"),
              render: (row) => formatCell(row.Asset_name),
            },
            {
              key: "Asset_type",
              header: translateHrmsLookup(language, "headers", "Type"),
              render: (row) => formatCell(row.Asset_type),
            },
            {
              key: "Serial_number",
              header: translateHrmsLookup(language, "headers", "Serial Number"),
              render: (row) => formatCell(row.Serial_number),
            },
            {
              key: "Allocation_date",
              header: translateHrmsLookup(language, "headers", "Allocated On"),
              render: (row) => formatDateDisplay(String(row.Allocation_date ?? "")) || "—",
            },
            {
              key: "Return_date",
              header: translateHrmsLookup(language, "headers", "Return Date"),
              render: (row) => formatDateDisplay(String(row.Return_date ?? "")) || "—",
            },
            {
              key: "Allocation_status",
              header: translateHrmsLookup(language, "headers", "Status"),
              render: (row) => <SoftStatus value={displayStatus(row)} />,
            },
          ]}
        />
      </div>

      <MasterDataModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("employees.assets.allocateTitle")}
        subtitle={t("employees.assets.allocateSubtitle")}
        submitLabel={t("employees.assets.allocateSubmit")}
        fields={addFields}
        size={config.modalSize}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title={t("employees.assets.updateTitle")}
        subtitle={t("employees.assets.updateSubtitle")}
        submitLabel={t("employees.assets.updateSubmit")}
        fields={editFields}
        size={config.modalSize}
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}
