"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, List } from "lucide-react";
import { MasterDataModal } from "@/components/modals/MasterDataModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import {
  CalendarDetailsSidebar,
  holidayTypeToneClass,
  type CalendarSidebarItem,
} from "@/components/ui/CalendarDetailsSidebar";
import { CalendarSplitLayout } from "@/components/ui/CalendarSplitLayout";
import {
  MonthCalendar,
  type MonthCalendarDayItem,
} from "@/components/ui/MonthCalendar";
import { YearCalendar } from "@/components/ui/YearCalendar";
import { useToast } from "@/components/ui/ToastProvider";
import { getHrmsModule, getModuleFormFields } from "@/config/hrms-modules";
import {
  ApiError,
  applOptionService,
  applOptionsToSelectOptions,
  HOLIDAY_TYPE_OPT_GRP_ID,
  holidayService,
  finYearService,
} from "@/lib/api";
import { queueAuditLog, resolveAuditRecordId } from "@/lib/audit-log";
import { formatDateDisplay, isSameDay, parseDateToIso } from "@/lib/date-utils";
import { latestFinancialYear } from "@/lib/leave-module-utils";
import { getModuleEmptyIcon } from "@/lib/module-icons";
import { cn } from "@/lib/utils";
import type { ApplOptionRecord } from "@/lib/api/types";
import type { FormField, HrmsRow } from "@/types/hrms";

const MODULE_ID = "holidays";
type HolidayViewMode = "month" | "year" | "list";

function formatCell(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function withHolidayFormOptions(
  fields: FormField[],
  purposeOptions: Array<{ value: string; label: string }>,
  finYearOptions: Array<{ value: string; label: string }>,
): FormField[] {
  return fields.map((field) => {
    if (field.name === "Purpose" && purposeOptions.length > 0) {
      return { ...field, type: "select", options: purposeOptions };
    }
    if (field.name === "Fin_year" && finYearOptions.length > 0) {
      return { ...field, type: "select", options: finYearOptions };
    }
    return field;
  });
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

function resolveFinancialYearLabel(
  row: HrmsRow,
  finYearOptions: Array<{ value: string; label: string }>,
): string {
  const id = String(row.Fin_year ?? row.Fin_Year ?? row.Year_Id ?? "").trim();
  const existing = String(row.Financial_year ?? "").trim();
  if (id) {
    const matched = finYearOptions.find((option) => option.value === id);
    if (matched) return matched.label;
  }
  if (existing) {
    const byName = finYearOptions.find(
      (option) => option.label === existing || option.value === existing,
    );
    if (byName) return byName.label;
    return existing;
  }
  return id;
}

function withResolvedLabels(
  rows: HrmsRow[],
  purposeOptions: Array<{ value: string; label: string }>,
  finYearOptions: Array<{ value: string; label: string }>,
): HrmsRow[] {
  return rows.map((row) => {
    const finYearId = String(row.Fin_year ?? row.Fin_Year ?? row.Year_Id ?? "").trim();
    const financialYear = resolveFinancialYearLabel(row, finYearOptions);
    return {
      ...row,
      Purpose: resolvePurposeLabel(row, purposeOptions) || formatCell(row.Purpose),
      Fin_year: finYearId,
      Financial_year: financialYear || formatCell(row.Financial_year),
    };
  });
}

function defaultFinYearId(finYearOptions: Array<{ value: string; label: string }>): string {
  if (finYearOptions.length === 0) return "";
  const latestName = latestFinancialYear(finYearOptions.map((option) => option.label));
  const matched =
    finYearOptions.find((option) => option.label === latestName) ?? finYearOptions[0];
  return matched?.value ?? "";
}

function toFormRow(
  row: HrmsRow,
  purposeOptions: Array<{ value: string; label: string }>,
  finYearOptions: Array<{ value: string; label: string }>,
): HrmsRow {
  const code = String(row.Holiday_type ?? "").trim();
  const label = String(row.Purpose ?? row.Holiday_type_name ?? "").trim();
  const matched =
    purposeOptions.find((option) => option.value === code) ??
    purposeOptions.find((option) => option.label === label || option.label === code);
  const dateRaw = String(row.Holiday_date ?? "").trim();
  const dateIso = parseDateToIso(dateRaw) || dateRaw;

  const finYearId = String(row.Fin_year ?? row.Fin_Year ?? row.Year_Id ?? "").trim();
  const finYearName = String(row.Financial_year ?? "").trim();
  const finMatched =
    finYearOptions.find((option) => option.value === finYearId) ??
    finYearOptions.find(
      (option) => option.label === finYearName || option.label === finYearId,
    );

  return {
    ...row,
    Purpose: matched?.value ?? code,
    Fin_year: finMatched?.value ?? finYearId,
    Holiday_date: dateIso ? formatDateDisplay(dateIso) : "",
    Holiday_name: String(row.Holiday_name ?? "").trim(),
  };
}

function holidayDateIso(row: HrmsRow): string {
  const raw = String(row.Holiday_date ?? "").trim();
  return parseDateToIso(raw) || raw;
}

function buildHolidayDayItem(
  date: string,
  day: number,
  holidaysOnDay: HrmsRow[],
  today: Date,
): MonthCalendarDayItem {
  const [y, m] = date.split("-").map(Number);
  const dateObj = new Date(y, m - 1, day);
  const primary = holidaysOnDay[0];
  const holidayName = String(primary?.Holiday_name ?? "").trim();
  const purpose = String(primary?.Purpose ?? "").trim();
  const financialYear = String(primary?.Financial_year ?? "").trim();
  const extraCount = holidaysOnDay.length - 1;

  return {
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
    details: primary
      ? [
          purpose ? { label: "Purpose", value: purpose } : null,
          { label: "Date", value: formatDateDisplay(date) },
          financialYear ? { label: "Financial Year", value: financialYear } : null,
          extraCount > 0
            ? { label: "Also on this day", value: `${extraCount} more holiday(s)` }
            : null,
        ].filter((row): row is { label: string; value: string } => row !== null)
      : [{ label: "Tip", value: "Click to add a holiday on this date." }],
  };
}

export default function HolidaysPage() {
  const config = getHrmsModule(MODULE_ID);
  const toast = useToast();
  const today = useMemo(() => new Date(), []);
  const [rows, setRows] = useState<HrmsRow[]>([]);
  const [purposeOptions, setPurposeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [finYearOptions, setFinYearOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<HolidayViewMode>("month");
  const [year, setYear] = useState(() => today.getFullYear());
  const [month, setMonth] = useState(() => today.getMonth() + 1);
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaults, setAddDefaults] = useState<Partial<HrmsRow> | undefined>();
  const [editRow, setEditRow] = useState<HrmsRow | null>(null);

  const baseFormFields = useMemo(() => getModuleFormFields(config), [config]);
  const formFields = useMemo(
    () => withHolidayFormOptions(baseFormFields, purposeOptions, finYearOptions),
    [baseFormFields, purposeOptions, finYearOptions],
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const [holidayRows, typeOptions, yearRows] = await Promise.all([
        holidayService.list(),
        applOptionService.list({ opt_grp_id: HOLIDAY_TYPE_OPT_GRP_ID, is_active: 1 }),
        finYearService.list({ status: 1 }),
      ]);
      const mappedPurpose = applOptionsToSelectOptions(typeOptions as ApplOptionRecord[]);
      const mappedYears = yearRows
        .map((row) => {
          const id = String(row.Year_Id ?? row.id ?? "").trim();
          const name = String(row.Year_Name ?? row.Financial_year ?? "").trim();
          if (!id || !name) return null;
          return { value: id, label: name };
        })
        .filter((option): option is { value: string; label: string } => option !== null)
        .sort((left, right) =>
          right.label.localeCompare(left.label, undefined, { numeric: true }),
        );

      setPurposeOptions(mappedPurpose);
      setFinYearOptions(mappedYears);
      setRows(withResolvedLabels(holidayRows, mappedPurpose, mappedYears));
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

  const openAddForm = useCallback(
    (defaults?: Partial<HrmsRow>) => {
      setEditRow(null);
      setAddDefaults({
        Fin_year: defaultFinYearId(finYearOptions),
        ...defaults,
      });
      setAddOpen(true);
    },
    [finYearOptions],
  );

  const closeAddForm = useCallback(() => {
    setAddOpen(false);
    setAddDefaults(undefined);
  }, []);

  const handleDayClick = useCallback(
    (date: string) => {
      const holidaysOnDay = rows.filter((row) => holidayDateIso(row) === date);
      const existing = holidaysOnDay[0];

      if (existing) {
        setAddOpen(false);
        setAddDefaults(undefined);
        setEditRow(toFormRow(existing, purposeOptions, finYearOptions));
        return;
      }

      openAddForm({
        Holiday_date: formatDateDisplay(date),
      });
    },
    [finYearOptions, openAddForm, purposeOptions, rows],
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

  const openMonthView = useCallback((nextMonth: number) => {
    setMonth(nextMonth);
    setViewMode("month");
  }, []);

  const calendarDays: MonthCalendarDayItem[] = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const items: MonthCalendarDayItem[] = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const holidaysOnDay = rows.filter((row) => holidayDateIso(row) === date);
      items.push(buildHolidayDayItem(date, day, holidaysOnDay, today));
    }

    return items;
  }, [month, rows, today, year]);

  const yearCalendarDays: MonthCalendarDayItem[] = useMemo(() => {
    const items: MonthCalendarDayItem[] = [];

    for (let m = 1; m <= 12; m += 1) {
      const daysInMonth = new Date(year, m, 0).getDate();
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const holidaysOnDay = rows.filter((row) => holidayDateIso(row) === date);
        if (holidaysOnDay.length === 0) {
          const [y, mo] = date.split("-").map(Number);
          const dateObj = new Date(y, mo - 1, day);
          if (isSameDay(dateObj, today)) {
            items.push({
              day,
              date,
              isToday: true,
              tone: "default",
            });
          }
          continue;
        }
        items.push(buildHolidayDayItem(date, day, holidaysOnDay, today));
      }
    }

    return items;
  }, [rows, today, year]);

  const sidebarItems: CalendarSidebarItem[] = useMemo(() => {
    const normalizedToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const yearPrefix = `${year}-`;
    const yearHolidays = rows
      .map((row) => ({
        row,
        iso: holidayDateIso(row),
      }))
      .filter(({ iso }) => iso.startsWith(yearPrefix))
      .sort((a, b) => a.iso.localeCompare(b.iso));

    const nextIso =
      yearHolidays.find(({ iso }) => {
        const date = parseDateToIso(iso) || iso;
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
        if (!match) return false;
        const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return d >= normalizedToday;
      })?.iso ?? null;

    return yearHolidays.map(({ row, iso }) => {
      const purpose = String(row.Purpose ?? "").trim();
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
      const d = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : null;
      const isUpcoming = d ? d >= normalizedToday : false;
      return {
        id: String(row.id ?? row.Holiday_id ?? iso),
        date: iso,
        title: String(row.Holiday_name ?? "Holiday"),
        meta: purpose || undefined,
        metaToneClass: purpose ? holidayTypeToneClass(purpose) : undefined,
        muted: !isUpcoming,
        isNext: Boolean(nextIso && iso === nextIso && isUpcoming),
      };
    });
  }, [rows, today, year]);

  const handleSidebarItemClick = useCallback(
    (item: CalendarSidebarItem) => {
      const existing = rows.find((row) => {
        const id = String(row.id ?? row.Holiday_id ?? "");
        return id === String(item.id) || holidayDateIso(row) === item.date;
      });
      if (existing) {
        setAddOpen(false);
        setAddDefaults(undefined);
        setEditRow(toFormRow(existing, purposeOptions, finYearOptions));
        return;
      }
      openAddForm({ Holiday_date: formatDateDisplay(item.date) });
    },
    [finYearOptions, openAddForm, purposeOptions, rows],
  );

  const handleSave = async (values: HrmsRow, mode: "add" | "edit") => {
    try {
      const purposeCode = String(values.Purpose ?? "").trim();
      const finYear = String(values.Fin_year ?? values.Fin_Year ?? values.Year_Id ?? "").trim();
      const payload: HrmsRow = {
        ...values,
        Holiday_type: purposeCode,
        Purpose: purposeCode,
        Fin_year: finYear,
        Year_Id: finYear,
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
          viewMode === "month"
            ? "bg-card text-title shadow-sm"
            : "text-muted hover:text-title",
        )}
        onClick={() => setViewMode("month")}
      >
        <CalendarDays size={14} />
        Month
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          viewMode === "year"
            ? "bg-card text-title shadow-sm"
            : "text-muted hover:text-title",
        )}
        onClick={() => setViewMode("year")}
      >
        <CalendarRange size={14} />
        Year
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
        {viewMode === "list" ? (
          <DataTable
            title={config.title}
            searchPlaceholder="Search holiday calendar..."
            rows={rows}
            loading={loading}
            searchKeys={config.searchKeys}
            filterFields={[
              { key: "Purpose", label: "Purpose" },
              { key: "Financial_year", label: "Financial Year" },
            ]}
            onRowEdit={(row) => setEditRow(toFormRow(row, purposeOptions, finYearOptions))}
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
                key: "Financial_year",
                header: "Financial Year",
                render: (row) => formatCell(row.Financial_year),
              },
            ]}
          />
        ) : (
          <CalendarSplitLayout
            className="mb-4"
            syncKey={`${viewMode}-${year}-${month}`}
            calendar={
              viewMode === "month" ? (
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
                      Click an empty day to add a holiday, or an existing holiday to edit it.
                    </p>
                  }
                />
              ) : (
                <YearCalendar
                  year={year}
                  days={yearCalendarDays}
                  title="Holiday Calendar"
                  loading={loading}
                  onPrevYear={() => setYear((y) => y - 1)}
                  onNextYear={() => setYear((y) => y + 1)}
                  onYearChange={setYear}
                  onMonthSelect={openMonthView}
                  onDayClick={handleDayClick}
                  legend={[{ tone: "holiday", label: "Holiday" }]}
                  headerExtra={
                    <p className="text-xs text-muted mb-0">
                      All months for {year}. Click a month name for details, or a day to add/edit.
                    </p>
                  }
                />
              )
            }
            sidebar={
              <CalendarDetailsSidebar
                title="Upcoming Holidays"
                subtitle={`Corporate schedule for ${year}`}
                items={sidebarItems}
                loading={loading}
                emptyMessage={`No holidays found for ${year}.`}
                onItemClick={handleSidebarItemClick}
                className="w-full"
              />
            }
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
