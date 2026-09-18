"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, PersonCell, ClampedText } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n, translateHrmsLookup } from "@/i18n";
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
import { formatEmployeeOptionLabel } from "@/lib/attendance-module-utils";
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
      const name = String(row.Display_name ?? row.Employee_name ?? "").trim();
      const code = String(row.Employee_code ?? "").trim();
      return { value: id, label: formatEmployeeOptionLabel(code, name) || id };
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
  const { language, t } = useI18n();
  const config = getHrmsModule(MODULE_ID);
  const pageTitle = translateHrmsLookup(language, "titles", config.title);
  const pageSection = translateHrmsLookup(language, "sections", config.section);
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
        title: mode === "edit" ? t("employees.serviceHistory.updatedToast") : t("employees.serviceHistory.addedToast"),
        message: t("employees.serviceHistory.savedMessage", {
          event: String(saved.Event_type ?? ""),
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
        title: mode === "edit" ? t("employees.serviceHistory.updateFailed") : t("employees.serviceHistory.saveFailed"),
        message:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : t("employees.serviceHistory.formError"),
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
        title: t("employees.serviceHistory.removedToast"),
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
      <PageHeader title={pageTitle} section={pageSection} hideTitle />
      <div className="container-fluid">
        <DataTable
          title={pageTitle}
          searchPlaceholder={t("employees.serviceHistory.search")}
          actionLabel={
            config.actionLabel
              ? translateHrmsLookup(language, "actions", config.actionLabel)
              : t("employees.serviceHistory.addTitle")
          }
          onAction={() => setAddOpen(true)}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={[
            {
              key: "Event_type",
              label: translateHrmsLookup(language, "labels", "Event Type"),
            },
          ]}
          onRowEdit={(row) => setEditRow(toFormRow(row))}
          showRowActions
          deleteConfirmTitle={t("employees.serviceHistory.deleteConfirm")}
          deleteConfirmMessage={t("employees.serviceHistory.deleteConfirmMessage")}
          getDeleteLabel={(row) => String(row.Event_type ?? "this service event")}
          onRowDelete={(row) => {
            void handleDelete(row);
          }}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle={t("employees.serviceHistory.emptyTitle")}
          emptyStateMessage={t("employees.serviceHistory.emptyMessage")}
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
              key: "Event_type",
              header: translateHrmsLookup(language, "headers", "Event Type"),
              render: (row) => formatCell(row.Event_type),
            },
            {
              key: "Effective_date",
              header: translateHrmsLookup(language, "headers", "Effective Date"),
              render: (row) => formatDateDisplay(String(row.Effective_date ?? "")) || "—",
            },
            {
              key: "Old_value",
              header: translateHrmsLookup(language, "headers", "Previous"),
              render: (row) => formatCell(row.Old_value),
            },
            {
              key: "New_value",
              header: translateHrmsLookup(language, "headers", "Updated To"),
              render: (row) => formatCell(row.New_value),
            },
            {
              key: "Remarks",
              header: translateHrmsLookup(language, "headers", "Remarks"),
              render: (row) => (
                <ClampedText text={String(row.Remarks ?? "")} />
              ),
            },
          ]}
        />
      </div>

      <MasterDataModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("employees.serviceHistory.addTitle")}
        subtitle={t("employees.serviceHistory.addSubtitle")}
        submitLabel={t("employees.serviceHistory.addSubmit")}
        fields={formFields}
        size={config.modalSize}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title={t("employees.serviceHistory.editTitle")}
        subtitle={t("employees.serviceHistory.editSubtitle")}
        submitLabel={t("employees.serviceHistory.editSubmit")}
        fields={formFields}
        size={config.modalSize}
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}
