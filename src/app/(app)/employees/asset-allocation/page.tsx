"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, PersonCell, SoftStatus } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
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
      const name = String(row.Display_name ?? row.Employee_name ?? id).trim();
      const code = String(row.Employee_code ?? "").trim();
      return { value: id, label: code ? `${name} (${code})` : name };
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
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [employees, setEmployees] = useState<HrmsRow[]>([]);
  const [assets, setAssets] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

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
        title: mode === "edit" ? "Allocation updated" : "Asset allocated",
        message: `"${saved.Asset_name || saved.Asset_code}" is now ${String(saved.Allocation_status).toLowerCase()} to ${saved.Employee_name}.`,
      });

      if (mode === "edit") {
        setEditRow(null);
      } else {
        setAddOpen(false);
      }
    } catch (error) {
      toast.error({
        title: mode === "edit" ? "Update failed" : "Allocation failed",
        message:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Please review the form and try again.",
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
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        <div className="stat-grid mb-4">
          <StatCard
            title="Currently Allocated"
            value={String(stats.allocated)}
            change="active"
            hint="issued"
            description="Assets issued to employees"
            tone="info"
            icon="briefcase"
          />
          <StatCard
            title="Available"
            value={String(stats.available)}
            change="in stock"
            hint="ready"
            description="Assets free to allocate"
            tone="success"
            icon="users"
          />
          <StatCard
            title="Returned"
            value={String(stats.returned)}
            change="closed"
            hint="records"
            description="Assets returned to inventory"
            tone="primary"
            icon="clock"
          />
        </div>

        <DataTable
          title={config.title}
          searchPlaceholder="Search by employee, asset code, or serial..."
          actionLabel={config.actionLabel}
          onAction={() => setAddOpen(true)}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={[
            { key: "Asset_type", label: "Asset Type" },
            { key: "Allocation_status", label: "Status" },
          ]}
          onRowEdit={(row) => setEditRow(toFormRow(row))}
          showRowActions
          deleteConfirmTitle="Remove allocation record?"
          deleteConfirmMessage='Remove the allocation of "{name}"? This does not delete the asset from the master list.'
          getDeleteLabel={(row) =>
            String(row.Asset_name ?? row.Asset_code ?? "this allocation")
          }
          onRowDelete={(row) => {
            void handleDelete(row);
          }}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle="No asset allocations yet"
          emptyStateMessage="Allocate a company asset to an employee to start tracking issue and return."
          columns={[
            {
              key: "Employee_name",
              header: "Employee",
              render: (row) => (
                <PersonCell
                  name={String(row.Employee_name ?? "—")}
                  subtitle={String(row.Employee_code ?? "")}
                />
              ),
            },
            {
              key: "Asset_code",
              header: "Asset Code",
              render: (row) => formatCell(row.Asset_code),
            },
            {
              key: "Asset_name",
              header: "Asset",
              render: (row) => formatCell(row.Asset_name),
            },
            {
              key: "Asset_type",
              header: "Type",
              render: (row) => formatCell(row.Asset_type),
            },
            {
              key: "Serial_number",
              header: "Serial Number",
              render: (row) => formatCell(row.Serial_number),
            },
            {
              key: "Allocation_date",
              header: "Allocated On",
              render: (row) => formatDateDisplay(String(row.Allocation_date ?? "")) || "—",
            },
            {
              key: "Return_date",
              header: "Return Date",
              render: (row) => formatDateDisplay(String(row.Return_date ?? "")) || "—",
            },
            {
              key: "Allocation_status",
              header: "Status",
              render: (row) => <SoftStatus value={displayStatus(row)} />,
            },
          ]}
        />
      </div>

      <MasterDataModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Allocate Asset"
        subtitle="Issue a company asset to an employee."
        submitLabel="Allocate"
        fields={addFields}
        size={config.modalSize}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title="Update Allocation"
        subtitle="Change assignment details or mark the asset as returned."
        submitLabel="Save Allocation"
        fields={editFields}
        size={config.modalSize}
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}
