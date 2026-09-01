"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DatePicker } from "@/components/ui/DatePicker";
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
import {
  ApiError,
  applOptionService,
  applOptionsToSelectOptions,
  attendanceService,
  employeeService,
  toFormRow,
  workShiftService,
} from "@/lib/api";
import { queueAuditLog, resolveAuditRecordId } from "@/lib/audit-log";
import { enrichEmployeeAttendanceRow } from "@/lib/attendance-module-utils";
import { DAILY_STATS } from "@/lib/attendance-stats";
import { dateToIso, formatDateDisplay, parseDateToIso } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import type { ApplOptionRecord } from "@/lib/api/types";
import type { FormField, HrmsRow, TableColumn } from "@/types/hrms";

const MODULE_ID = "daily-attendance";
const ATTENDANCE_SOURCE_OPT_GRP_ID = 7;
const ATTENDANCE_STATUS_OPT_GRP_ID = 8;

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

function selectOptionsFromEmployees(
  employees: HrmsRow[],
): Array<{ value: string; label: string }> {
  return employees
    .map((row) => {
      const code = String(row.Employee_code ?? "").trim();
      if (!code) return null;
      const name = String(row.Display_name ?? row.Employee_name ?? code).trim();
      return { value: code, label: `${name} (${code})` };
    })
    .filter((option): option is { value: string; label: string } => option !== null);
}

function selectOptionsFromShifts(shifts: HrmsRow[]): Array<{ value: string; label: string }> {
  return shifts
    .map((row) => {
      const name = String(row.Shift_name ?? "").trim();
      if (!name) return null;
      const code = String(row.Shift_code ?? "").trim();
      return { value: name, label: code ? `${name} (${code})` : name };
    })
    .filter((option): option is { value: string; label: string } => option !== null);
}

function withDailyFormOptions(
  fields: FormField[],
  employees: HrmsRow[],
  shifts: HrmsRow[],
  statusOptions: Array<{ value: string; label: string }>,
  sourceOptions: Array<{ value: string; label: string }>,
): FormField[] {
  const employeeOptions = selectOptionsFromEmployees(employees);
  const shiftOptions = selectOptionsFromShifts(shifts);

  return fields.map((field) => {
    if (field.name === "Employee_code" && employeeOptions.length > 0) {
      return { ...field, options: employeeOptions };
    }
    if (field.name === "Shift_name" && shiftOptions.length > 0) {
      return { ...field, options: shiftOptions };
    }
    if (field.name === "Attendance_status" && statusOptions.length > 0) {
      return { ...field, options: statusOptions.map((option) => option.label) };
    }
    if (field.name === "Source" && sourceOptions.length > 0) {
      return { ...field, options: sourceOptions.map((option) => option.label) };
    }
    return field;
  });
}

export default function DailyAttendancePage() {
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(() => dateToIso(new Date()));
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [employees, setEmployees] = useState<HrmsRow[]>([]);
  const [shifts, setShifts] = useState<HrmsRow[]>([]);
  const [statusOptions, setStatusOptions] = useState<ApplOptionRecord[]>([]);
  const [sourceOptions, setSourceOptions] = useState<ApplOptionRecord[]>([]);
  const [punchRows, setPunchRows] = useState<HrmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const baseFormFields = useMemo(() => getModuleFormFields(config), [config]);
  const columns = useMemo(() => buildColumns(config.columns), [config.columns]);
  const filterFields = useMemo(() => getModuleFilterFields(config), [config]);

  const lookupContext = useMemo(
    () => ({
      employees,
      shifts,
      statusOptions,
      sourceOptions,
    }),
    [employees, shifts, statusOptions, sourceOptions],
  );

  const loadLookups = useCallback(async () => {
    const [employeeRows, shiftRows, statusRecords, sourceRecords] = await Promise.all([
      employeeService.list({ status: 1 }),
      workShiftService.list(),
      applOptionService.list({
        opt_grp_id: ATTENDANCE_STATUS_OPT_GRP_ID,
        is_active: 1,
      }),
      applOptionService.list({
        opt_grp_id: ATTENDANCE_SOURCE_OPT_GRP_ID,
        is_active: 1,
      }),
    ]);

    setEmployees(employeeRows);
    setShifts(shiftRows);
    setStatusOptions(statusRecords as ApplOptionRecord[]);
    setSourceOptions(sourceRecords as ApplOptionRecord[]);
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const attendanceRows = await attendanceService.list({
        attendance_date: selectedDate,
      });
      setRows(attendanceRows);
    } catch (error) {
      toast.error({
        title: "Unable to load daily attendance",
        message:
          error instanceof ApiError
            ? error.message
            : "Please check your connection and try again.",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, toast]);

  useEffect(() => {
    void loadLookups().catch(() => {
      toast.error({
        title: "Unable to load attendance lookups",
        message: "Employee, shift, or option lists could not be loaded.",
      });
    });
  }, [loadLookups, toast]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const formFields = useMemo(
    () =>
      withDailyFormOptions(
        baseFormFields,
        employees,
        shifts,
        applOptionsToSelectOptions(statusOptions),
        applOptionsToSelectOptions(sourceOptions),
      ),
    [baseFormFields, employees, shifts, statusOptions, sourceOptions],
  );

  const loadPunches = useCallback(
    async (row: HrmsRow) => {
      const employeeId = Number(row.Employee_id ?? 0);
      if (!Number.isFinite(employeeId) || employeeId <= 0) {
        setPunchRows([]);
        return;
      }

      setPunchLoading(true);
      try {
        const punches = await attendanceService.punchList({
          employee_id: employeeId,
          punch_date: selectedDate,
        });
        setPunchRows(punches);
      } catch {
        setPunchRows([]);
      } finally {
        setPunchLoading(false);
      }
    },
    [selectedDate],
  );

  const handleEdit = async (row: HrmsRow) => {
    setEditRow(toFormRow(row));
    await loadPunches(row);
  };

  const handleSave = async (values: HrmsRow, mode: "add" | "edit") => {
    try {
      const enriched = enrichEmployeeAttendanceRow(values, employees);
      const payloadRow = {
        ...enriched,
        Attendance_date: enriched.Attendance_date || formatDateDisplay(selectedDate),
      };
      const previous = mode === "edit" ? editRow ?? undefined : undefined;

      const saved =
        mode === "edit" && editRow?.id
          ? await attendanceService.update(editRow.id, payloadRow, lookupContext)
          : await attendanceService.create(payloadRow, lookupContext);

      queueAuditLog({
        moduleId: MODULE_ID,
        action: mode === "edit" ? "update" : "create",
        recordId: resolveAuditRecordId(saved as Record<string, unknown>),
        oldValues: previous,
        newValues: saved,
      });

      await loadRows();

      const label = String(saved.Employee_name ?? saved.Employee_code ?? "Record");
      toast.success({
        title: mode === "edit" ? "Daily attendance updated" : "Daily attendance saved",
        message: `"${label}" has been ${mode === "edit" ? "updated" : "added"}.`,
      });

      if (mode === "edit") {
        setEditRow(null);
        setPunchRows([]);
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
              : "Unable to save attendance.",
      });
    }
  };

  const handleDelete = async (row: HrmsRow) => {
    try {
      await attendanceService.remove(row.id);
      queueAuditLog({
        moduleId: MODULE_ID,
        action: "delete",
        recordId: resolveAuditRecordId(row as Record<string, unknown>),
        oldValues: row,
      });
      await loadRows();
      toast.success({
        title: "Record removed",
        message: `"${String(row.Employee_name ?? row.Employee_code ?? "Record")}" was removed.`,
      });
    } catch (error) {
      toast.error({
        title: "Delete failed",
        message:
          error instanceof ApiError ? error.message : "Unable to delete attendance record.",
      });
    }
  };

  const deleteLabel = (row: HrmsRow) =>
    String(row[config.nameKey] ?? row.Employee_name ?? "this record");

  const punchSummary =
    punchRows.length > 0
      ? `${punchRows.length} punch record${punchRows.length === 1 ? "" : "s"} on ${formatDateDisplay(selectedDate)}`
      : punchLoading
        ? "Loading punch records..."
        : `No punch records on ${formatDateDisplay(selectedDate)}`;

  return (
    <>
      <PageHeader title={config.title} section={config.section} hideTitle />
      <div className="container-fluid">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-xs">
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
              Attendance date
            </label>
            <DatePicker
              value={formatDateDisplay(selectedDate)}
              onChange={(value) => {
                const iso = parseDateToIso(value);
                if (iso) setSelectedDate(iso);
              }}
              clearable={false}
            />
          </div>
        </div>

        <div className="stat-grid mb-4">
          {DAILY_STATS.map((stat) => (
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

        <DataTable
          title={config.title}
          searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
          actionLabel={config.actionLabel}
          onAction={() => setAddOpen(true)}
          rows={rows}
          loading={loading}
          searchKeys={config.searchKeys}
          filterFields={filterFields}
          onRowEdit={handleEdit}
          showRowActions
          deleteConfirmTitle="Remove attendance record?"
          deleteConfirmMessage='Remove "{name}" from the list?'
          getDeleteLabel={deleteLabel}
          onRowDelete={handleDelete}
          emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
          emptyStateTitle={`No ${config.title.toLowerCase()} records yet`}
          emptyStateMessage="Mark attendance for employees to track check-in, check-out, and daily status."
          columns={columns}
        />
      </div>

      <MasterDataModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={config.actionLabel ?? `Add ${config.title}`}
        subtitle="Mark daily attendance with check-in, check-out, working hours, and status."
        submitLabel="Save"
        fields={formFields}
        size={config.modalSize}
        initialValues={{
          id: "",
          Attendance_date: formatDateDisplay(selectedDate),
          Source: "Manual attendance",
        }}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={Boolean(editRow)}
        onClose={() => {
          setEditRow(null);
          setPunchRows([]);
        }}
        title={`Edit ${config.title}`}
        subtitle={`${punchSummary}. Update check-in, check-out, and status as needed.`}
        submitLabel="Save Changes"
        fields={formFields}
        size={config.modalSize}
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}
