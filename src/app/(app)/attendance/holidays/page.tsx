"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, List } from "lucide-react";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClampedText, DataTable } from "@/components/ui/DataTable";
import {
  MonthCalendar,
  type MonthCalendarDayItem,
} from "@/components/ui/MonthCalendar";
import { useToast } from "@/components/ui/ToastProvider";
import { getHrmsModule, getModuleFormFields } from "@/config/hrms-modules";
import {
  ApiError,
  applOptionService,
  applOptionsToSelectOptions,
  HOLIDAY_TYPE_OPT_GRP_ID,
  holidayService,
} from "@/lib/api";
import { queueAuditLog, resolveAuditRecordId } from "@/lib/audit-log";
import { formatDateDisplay, isSameDay, parseDateToIso } from "@/lib/date-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { cn } from "@/lib/utils";
import type { ApplOptionRecord } from "@/lib/api/types";
import type { FormField, HrmsRow } from "@/types/hrms";

const MODULE_ID = "holidays";

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function withPurposeOptions(
  fields: FormField[],
  purposeOptions: Array<{ value: string; label: string }>,
): FormField[] {
  if (purposeOptions.length === 0) return fields;
  return fields.map((field) =>
    field.name === "Purpose" ? { ...field, type: "select", options: purposeOptions } : field,
  );
}

function resolvePurposeLabel(
  row: HrmsRow,
  purposeOptions: Array<{ value: string; label: string }>,
): string {
  const code = String(row.Holiday_type ?? row.Purpose ?? "").trim();
  if (!code) return "";
  const matched = purposeOptions.find((option) => option.value === code);
  if (matched) return matched.label;
  const existing = String(row.Holiday_type_name ?? row.Purpose ?? "").trim();
  if (existing && existing !== code) return existing;
  return code;
}

function withResolvedPurpose(
  rows: HrmsRow[],
  purposeOptions: Array<{ value: string; label: string }>,
): HrmsRow[] {
  return rows.map((row) => ({
    ...row,
    Purpose: resolvePurposeLabel(row, purposeOptions) || formatCell(row.Purpose),
  }));
}

function toFormRow(
  row: HrmsRow,
  purposeOptions: Array<{ value: string; label: string }>,
): HrmsRow {
  const code = String(row.Holiday_type ?? "").trim();
  const label = String(row.Purpose ?? row.Holiday_type_name ?? "").trim();
  const matched =
    purposeOptions.find((option) => option.value === code) ??
    purposeOptions.find((option) => option.label === label || option.label === code);
  const dateRaw = String(row.Holiday_date ?? "").trim();
  const dateIso = parseDateToIso(dateRaw) || dateRaw;

  return {
    ...row,
    Purpose: matched?.value ?? code,
    Holiday_date: dateIso ? formatDateDisplay(dateIso) : "",
    Holiday_name: String(row.Holiday_name ?? "").trim(),
    Remarks: String(row.Remarks ?? ""),
  };
}

function holidayDateIso(row: HrmsRow): string {
  const raw = String(row.Holiday_date ?? "").trim();
  return parseDateToIso(raw) || raw;
}

export default function HolidaysPage() {
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();
  const today = useMemo(() => new Date(), []);
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [year, setYear] = useState(() => today.getFullYear());
  const [month, setMonth] = useState(() => today.getMonth() + 1);
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaults, setAddDefaults] = useState<Partial<HrmsRow> | undefined>();
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const baseFormFields = useMemo(() => getModuleFormFields(config), [config]);
  const formFields = useMemo(
    () => withPurposeOptions(baseFormFields, purposeOptions),
    [baseFormFields, purposeOptions],
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const [holidayRows, typeOptions] = await Promise.all([
        holidayService.list(),
        applOptionService.list({ opt_grp_id: HOLIDAY_TYPE_OPT_GRP_ID, is_active: 1 }),
      ]);
      const mappedOptions = applOptionsToSelectOptions(typeOptions as ApplOptionRecord[]);
      setPurposeOptions(mappedOptions);
      setRows(withResolvedPurpose(holidayRows, mappedOptions));
    } catch (error) {
      toast.error({
        title: "Unable to load holiday calendar",
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial/async data load
    void loadRows();
  }, [loadRows]);

  const openAddForm = useCallback((defaults?: Partial<HrmsRow>) => {
    setEditRow(null);
    setAddDefaults(defaults);
    setAddOpen(true);
  }, []);

  const closeAddForm = useCallback(() => {
    setAddOpen(false);
    setAddDefaults(undefined);
  }, []);

  const handleDayClick = useCallback(
    (date: string) => {
      openAddForm({
        Holiday_date: formatDateDisplay(date),
      });
    },
    [openAddForm],
  );

  const goPrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
      return;
    }
    setMonth((m) => m - 1);
  };

  const goNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
      return;
    }
    setMonth((m) => m + 1);
  };

  const calendarDays: MonthCalendarDayItem[] = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const items: MonthCalendarDayItem[] = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateObj = new Date(year, month - 1, day);
      const holidaysOnDay = rows.filter((row) => {
        const iso = holidayDateIso(row);
        return iso === date;
      });
      const primary = holidaysOnDay[0];
      const holidayName = String(primary?.Holiday_name ?? "").trim();
      const purpose = String(primary?.Purpose ?? "").trim();
      const remarks = String(primary?.Remarks ?? "").trim();
      const extraCount = holidaysOnDay.length - 1;

      items.push({
        day,
        date,
        isToday: isSameDay(dateObj, today),
        tone: primary ? "holiday" : "default",
        label: holidayName || undefined,
        subtitle: purpose
          ? extraCount > 0
            ? `${purpose} · +${extraCount}`
            : purpose
          : extraCount > 0
            ? `+${extraCount} more`
            : undefined,
        detailTitle: holidayName || undefined,
        detailBadge: purpose || (primary ? "Holiday" : undefined),
        detailDescription: remarks || undefined,
        details: primary
          ? [
              purpose ? { label: "Purpose", value: purpose } : null,
              { label: "Date", value: formatDateDisplay(date) },
              remarks ? { label: "Remarks", value: remarks } : null,
              extraCount > 0
                ? { label: "Also on this day", value: `${extraCount} more holiday(s)` }
                : null,
            ].filter((row): row is { label: string; value: string } => row !== null)
          : [{ label: "Tip", value: "Click to add a holiday on this date." }],
      });
    }

    return items;
  }, [month, rows, today, year]);

  const handleSave = async (values: HrmsRow, mode: "add" | "edit") => {
    try {
      const purposeCode = String(values.Purpose ?? "").trim();
      const payload: HrmsRow = {
        ...values,
        Holiday_type: purposeCode,
        Purpose: purposeCode,
      };

      const previous = mode === "edit" ? editRow ?? undefined : undefined;
      const saved =
        mode === "edit" && editRow?.id
          ? await holidayService.update(editRow.id, payload)
          : await holidayService.create(payload);

      queueAuditLog({
        moduleId: MODULE_ID,
        action: mode === "edit" ? "update" : "create",
        recordId: resolveAuditRecordId(saved as Record<string, unknown>),
        oldValues: previous,
        newValues: saved,
      });

      await loadRows();

      toast.success({
        title: mode === "edit" ? "Holiday updated" : "Holiday added",
        message: `"${saved.Holiday_name}" was saved successfully.`,
      });

      if (mode === "edit") {
        setEditRow(null);
      } else {
        closeAddForm();
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
      await holidayService.remove(row.id);
      queueAuditLog({
        moduleId: MODULE_ID,
        action: "delete",
        recordId: resolveAuditRecordId(row as Record<string, unknown>),
        oldValues: row,
      });
      await loadRows();
      toast.success({
        title: "Holiday removed",
        message: `"${row.Holiday_name}" was deleted.`,
      });
    } catch (error) {
      toast.error({
        title: "Delete failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to remove this holiday right now.",
      });
    }
  };

  const viewToggle = (
    <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card-soft)] p-1">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          viewMode === "calendar"
            ? "bg-card text-title shadow-sm"
            : "text-muted hover:text-title",
        )}
        onClick={() => setViewMode("calendar")}
      >
        <CalendarDays size={14} />
        Calendar
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          viewMode === "list"
            ? "bg-card text-title shadow-sm"
            : "text-muted hover:text-title",
        )}
        onClick={() => setViewMode("list")}
      >
        <List size={14} />
        List
      </button>
    </div>
  );

  return (
    <>
      <PageHeader
        title={config.title}
        section={config.section}
        hideTitle
        action={
          <div className="flex flex-wrap items-center gap-2">
            {viewToggle}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openAddForm()}
            >
              + {config.actionLabel ?? "Add New"}
            </button>
          </div>
        }
      />
      <div className="container-fluid">
        {viewMode === "calendar" ? (
          <div className="mb-4">
            <MonthCalendar
              year={year}
              month={month}
              days={calendarDays}
              title="Holiday Calendar"
              loading={loading}
              onPrevMonth={goPrev}
              onNextMonth={goNext}
              onYearChange={setYear}
              onMonthChange={setMonth}
              onDayClick={handleDayClick}
              legend={[{ tone: "holiday", label: "Holiday" }]}
              headerExtra={
                <p className="text-xs text-muted mb-0">
                  Click any day to add a holiday for that date.
                </p>
              }
            />
          </div>
        ) : (
          <DataTable
            title={config.title}
            searchPlaceholder="Search holiday calendar..."
            rows={rows}
            loading={loading}
            searchKeys={config.searchKeys}
            filterFields={[{ key: "Purpose", label: "Purpose" }]}
            onRowEdit={(row) => setEditRow(toFormRow(row, purposeOptions))}
            showRowActions
            deleteConfirmTitle="Delete holiday?"
            deleteConfirmMessage='Remove "{name}" from the holiday calendar? This action cannot be undone.'
            getDeleteLabel={(row) => String(row.Holiday_name ?? "this holiday")}
            onRowDelete={(row) => {
              void handleDelete(row);
            }}
            emptyStateIcon={getModuleEmptyIcon(MODULE_ID)}
            emptyStateTitle="No holidays yet"
            emptyStateMessage="Add a holiday to build the organization calendar."
            columns={[
              {
                key: "Purpose",
                header: "Purpose",
                render: (row) => formatCell(row.Purpose),
              },
              {
                key: "Holiday_date",
                header: "Date",
                render: (row) => formatDateDisplay(String(row.Holiday_date ?? "")) || "—",
              },
              {
                key: "Holiday_name",
                header: "Holiday",
                render: (row) => formatCell(row.Holiday_name),
              },
              {
                key: "Remarks",
                header: "Remarks",
                render: (row) => <ClampedText text={String(row.Remarks ?? "")} />,
              },
            ]}
          />
        )}
      </div>

      <MasterDataModal
        open={addOpen}
        onClose={closeAddForm}
        title="Add Holiday"
        subtitle="Create a new holiday for the organization calendar."
        submitLabel="Add Holiday"
        fields={formFields}
        size={config.modalSize}
        defaultValues={addDefaults}
        onSubmit={(values) => handleSave(values, "add")}
      />

      <MasterDataModal
        open={Boolean(editRow)}
        onClose={() => setEditRow(null)}
        title="Update Holiday"
        subtitle="Edit holiday details."
        submitLabel="Save Holiday"
        fields={formFields}
        size={config.modalSize}
        initialValues={editRow ?? undefined}
        onSubmit={(values) => handleSave(values, "edit")}
      />
    </>
  );
}
