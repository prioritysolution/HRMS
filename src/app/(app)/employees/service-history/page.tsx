"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, PersonCell } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { getHrmsModule, getModuleFormFields } from "@/config/hrms-modules";
import {
  ApiError,
  applOptionService,
  applOptionsToSelectOptions,
  employeeService,
  employeeServiceHistoryService,
} from "@/lib/api";
import { queueAuditLog, resolveAuditRecordId } from "@/lib/audit-log";
import { formatDateDisplay } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import type { ApplOptionRecord } from "@/lib/api/types";
import type { FormField, HrmsRow } from "@/types/hrms";

const MODULE_ID = "service-history";
const SERVICE_HISTORY_OPT_GRP_ID = 6;

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
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

function withSelectOptions(
  fields: FormField[],
  employees: HrmsRow[],
  eventTypeOptions: Array<{ value: string; label: string }>,
): FormField[] {
  const employeeOptions = selectOptionsFromEmployees(employees);

  return fields.map((field) => {
    if (field.name === "Employee_id" && employeeOptions.length > 0) {
      return { ...field, options: employeeOptions };
    }
    if (
      (field.name === "Event_type_code" ||
        field.name === "Old_Id" ||
        field.name === "New_Id") &&
      eventTypeOptions.length > 0
    ) {
      return { ...field, options: eventTypeOptions };
    }
    return field;
  });
}

function toFormRow(row: HrmsRow): HrmsRow {
  return {
    ...row,
    Employee_id: String(row.Employee_id ?? ""),
    Event_type_code: String(row.Event_type_code ?? ""),
    Old_Id: row.Old_Id !== null && row.Old_Id !== undefined ? String(row.Old_Id) : "",
    New_Id: row.New_Id !== null && row.New_Id !== undefined ? String(row.New_Id) : "",
    Old_Amount: row.Old_Amount ?? "",
    New_Amount: row.New_Amount ?? "",
  };
}

export default function ServiceHistoryPage() {
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [employees, setEmployees] = useState<HrmsRow[]>([]);
  const [eventTypeOptions, setEventTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const baseFormFields = useMemo(() => getModuleFormFields(config), [config]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRows, employeeRows, eventTypes] = await Promise.all([
        employeeServiceHistoryService.list(),
        employeeService.list({ status: 1 }),
        applOptionService.list({ opt_grp_id: SERVICE_HISTORY_OPT_GRP_ID, is_active: 1 }),
      ]);
      setRows(historyRows);
      setEmployees(employeeRows);
      setEventTypeOptions(applOptionsToSelectOptions(eventTypes as ApplOptionRecord[]));
    } catch (error) {
      toast.error({
        title: "Unable to load service history",
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

  const formFields = useMemo(
    () => withSelectOptions(baseFormFields, employees, eventTypeOptions),
    [baseFormFields, employees, eventTypeOptions],
  );

  const handleSave = async (values: HrmsRow, mode: "add" | "edit") => {
    try {
      const previous = mode === "edit" ? editRow ?? undefined : undefined;
      const saved =
        mode === "edit" && editRow?.id
          ? await employeeServiceHistoryService.update(editRow.id, values)
          : await employeeServiceHistoryService.create(values);

      queueAuditLog({
        moduleId: MODULE_ID,
        action: mode === "edit" ? "update" : "create",
        recordId: resolveAuditRecordId(saved as Record<string, unknown>),
        oldValues: previous,
        newValues: saved,
      });

      await loadRows();

      toast.success({
        title: mode === "edit" ? "Service event updated" : "Service event added",
        message: `${saved.Event_type} for ${saved.Employee_name} was saved successfully.`,
      });

      if (mode === "edit") {
        setEditRow(null);
      } else {
        setAddOpen(false);
      }
    } catch (error) {
      toast.error({
        title: mode === "edit" ? "Update failed" : "Save failed",
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
      await employeeServiceHistoryService.remove(row.id);
      queueAuditLog({
        moduleId: MODULE_ID,
        action: "delete",
        recordId: resolveAuditRecordId(row as Record<string, unknown>),
        oldValues: row,
      });
      await loadRows();
      toast.success({
        title: "Service event removed",
        message: `${row.Event_type} record for ${row.Employee_name} was deleted.`,
      });
    } catch (error) {
      toast.error({
        title: "Delete failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to remove this service event right now.",
      });
    }
  };

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        <DataTable
          title={config.title}
          searchPlaceholder="Search by employee, event type, or remarks..."
          actionLabel={config.actionLabel}
          onAction={() => setAddOpen(true)}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={[{ key: "Event_type", label: "Event Type" }]}
          onRowEdit={(row) => setEditRow(toFormRow(row))}
          showRowActions
          deleteConfirmTitle="Delete service event?"
          deleteConfirmMessage='Remove the "{name}" service event for this employee? This action cannot be undone.'
          getDeleteLabel={(row) => String(row.Event_type ?? "this service event")}
          onRowDelete={(row) => {
            void handleDelete(row);
          }}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle="No service history yet"
          emptyStateMessage="Add a service event to track promotions, transfers, and other employee milestones."
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
              key: "Event_type",
              header: "Event Type",
              render: (row) => formatCell(row.Event_type),
            },
            {
              key: "Effective_date",
              header: "Effective Date",
              render: (row) => formatDateDisplay(String(row.Effective_date ?? "")) || "—",
            },
            {
              key: "Old_value",
              header: "Previous",
              render: (row) => formatCell(row.Old_value),
            },
            {
              key: "New_value",
              header: "Updated To",
              render: (row) => formatCell(row.New_value),
            },
            {
              key: "Remarks",
              header: "Remarks",
              render: (row) => formatCell(row.Remarks),
            },
          ]}
        />
      </div>

      <MasterDataModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Service Event"
        subtitle="Record a promotion, transfer, or other employee service milestone."
        submitLabel="Add Event"
        fields={formFields}
        size={config.modalSize}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title="Update Service Event"
        subtitle="Edit the service event details."
        submitLabel="Save Event"
        fields={formFields}
        size={config.modalSize}
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}
