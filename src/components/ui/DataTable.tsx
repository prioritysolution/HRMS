"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Inbox,
  PlusCircle,
  Search,
  SquarePen,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ResetButton } from "@/components/ui/ResetButton";
import {
  formatConfirmMessage,
} from "@/lib/confirm-messages";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TableEmptyState } from "@/components/ui/TableEmptyState";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n, translateHrmsLookup } from "@/i18n";
import { resolvePublicFileUrl } from "@/lib/env";
import { getRowLabel } from "@/lib/row-label";
import { isRowInactive } from "@/lib/row-status";
import {
  applyTableFilters,
  applyTableSearch,
  getFilterOptions,
  getTotalPages,
  PAGE_SIZE_OPTIONS,
  paginateRows,
  type TableFilterDef,
} from "@/lib/table-utils";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T extends object> = {
  columns: Column<T>[];
  rows: T[];
  title?: React.ReactNode;
  searchPlaceholder?: string;
  actionLabel?: string;
  onAction?: () => void;
  showRowActions?: boolean;
  renderRowActions?: (row: T) => React.ReactNode;
  onRowEdit?: (row: T) => void;
  onRowDelete?: (row: T) => void | Promise<void>;
  onRowActivate?: (row: T) => void | Promise<void>;
  statusToggle?: boolean;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
  activateConfirmTitle?: string;
  activateConfirmMessage?: string;
  searchKeys?: string[];
  filterFields?: TableFilterDef[];
  defaultPageSize?: number;
  getDeleteLabel?: (row: T) => string;
  emptyStateIcon?: LucideIcon;
  loading?: boolean;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  extraActions?: React.ReactNode;
  /** Extra controls rendered inside the Filters bar (e.g. date range). */
  filterExtra?: React.ReactNode;
  /** Fires whenever search/filter results change (full filtered set, before pagination). */
  onFilteredRowsChange?: (rows: T[]) => void;
  /**
   * Server-driven pagination. When set, `rows` is treated as the current page
   * and page/size changes are delegated to the parent (API reload).
   */
  serverPagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
};

export function RowActions<T extends object>({
  row,
  onEdit,
  onDelete,
  onActivate,
  statusToggle = false,
  deleteConfirmTitle,
  deleteConfirmMessage,
  activateConfirmTitle,
  activateConfirmMessage,
  getDeleteLabel,
}: {
  row: T;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void | Promise<void>;
  onActivate?: (row: T) => void | Promise<void>;
  statusToggle?: boolean;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
  activateConfirmTitle?: string;
  activateConfirmMessage?: string;
  getDeleteLabel?: (row: T) => string;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(false);
  const rowLabel = getDeleteLabel?.(row) ?? getRowLabel(row);
  const inactive = statusToggle && isRowInactive(row);
  const isDeactivateAction =
    deleteConfirmTitle?.toLowerCase().includes("deactivate") ||
    deleteConfirmTitle?.toLowerCase().includes(t("common.deactivate").toLowerCase());

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(row);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }

      toast.success({
        title: isDeactivateAction
          ? t("common.dialog.deactivatedTitle")
          : t("common.dialog.deletedTitle"),
        message: isDeactivateAction
          ? t("common.dialog.deactivatedMessage", { name: rowLabel })
          : t("common.dialog.deletedMessage", { name: rowLabel }),
      });
      setConfirmOpen(false);
    } catch (error) {
      toast.error({
        title: isDeactivateAction
          ? t("common.dialog.deactivateFailed")
          : t("common.dialog.deleteFailed"),
        message:
          error instanceof Error
            ? error.message
            : t("common.dialog.deleteError"),
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmActivate = async () => {
    setActivating(true);
    try {
      if (onActivate) {
        await onActivate(row);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }

      toast.success({
        title: t("common.dialog.activatedTitle"),
        message: t("common.dialog.activatedMessage", { name: rowLabel }),
      });
      setActivateOpen(false);
    } catch (error) {
      toast.error({
        title: t("common.dialog.activateFailed"),
        message:
          error instanceof Error
            ? error.message
            : t("common.dialog.activateError"),
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <>
      <div className="table-actions">
        {onEdit ? (
          <button
            type="button"
            className="btn-action btn-action-edit"
            aria-label={t("common.edit")}
            onClick={() => onEdit(row)}
          >
            <SquarePen size={16} strokeWidth={2.25} />
          </button>
        ) : null}
        {inactive ? (
          <button
            type="button"
            className="btn-action btn-action-activate"
            aria-label={t("common.activate")}
            onClick={() => setActivateOpen(true)}
          >
            <CircleCheck size={16} strokeWidth={2.25} />
          </button>
        ) : (
          <button
            type="button"
            className="btn-action btn-action-delete"
            aria-label={isDeactivateAction ? t("common.deactivate") : t("common.delete")}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteConfirmTitle ?? t("common.dialog.deleteRecord")}
        message={
          deleteConfirmMessage
            ? formatConfirmMessage(deleteConfirmMessage, rowLabel)
            : isDeactivateAction
              ? t("common.dialog.deactivateMessage", { name: rowLabel })
              : t("common.dialog.deleteConfirm", { name: rowLabel })
        }
        confirmLabel={isDeactivateAction ? t("common.deactivate") : t("common.delete")}
        variant="danger"
        loading={deleting}
      />

      <ConfirmDialog
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        onConfirm={handleConfirmActivate}
        title={activateConfirmTitle ?? t("common.dialog.activateRecord")}
        message={
          activateConfirmMessage
            ? formatConfirmMessage(activateConfirmMessage, rowLabel)
            : t("common.dialog.activateMessage", { name: rowLabel })
        }
        confirmLabel={t("common.activate")}
        variant="success"
        loading={activating}
      />
    </>
  );
}

export function DataTable<T extends object>({
  columns,
  rows,
  title,
  searchPlaceholder,
  actionLabel,
  onAction,
  showRowActions = false,
  renderRowActions,
  onRowEdit,
  onRowDelete,
  onRowActivate,
  statusToggle = false,
  deleteConfirmTitle,
  deleteConfirmMessage,
  activateConfirmTitle,
  activateConfirmMessage,
  searchKeys,
  filterFields = [],
  defaultPageSize = 10,
  getDeleteLabel,
  emptyStateIcon: EmptyIcon = Inbox,
  loading = false,
  emptyStateTitle,
  emptyStateMessage,
  extraActions,
  filterExtra,
  onFilteredRowsChange,
  serverPagination,
}: DataTableProps<T>) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams?.get("search") ?? "");
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    filterFields.forEach((field) => {
      const value = searchParams?.get(field.key) || field.defaultValue;
      if (value) initial[field.key] = value;
    });
    return initial;
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const isServerPaged = Boolean(serverPagination);
  const activePage = serverPagination?.page ?? page;
  const activePageSize = serverPagination?.pageSize ?? pageSize;

  useEffect(() => {
    setFilters((prev) => {
      let changed = false;
      const next = { ...prev };
      filterFields.forEach((field) => {
        const fromUrl = searchParams?.get(field.key);
        if (fromUrl) return;
        if (prev[field.key]) return;
        if (!field.defaultValue) return;
        next[field.key] = field.defaultValue;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [filterFields, searchParams]);

  const resolvedSearchKeys = useMemo(
    () => searchKeys ?? columns.map((column) => column.key),
    [searchKeys, columns],
  );

  const filteredRows = useMemo(() => {
    const searched = applyTableSearch(rows, search, resolvedSearchKeys);
    return applyTableFilters(searched, filters);
  }, [rows, search, filters, resolvedSearchKeys]);

  useEffect(() => {
    onFilteredRowsChange?.(filteredRows);
  }, [filteredRows, onFilteredRowsChange]);

  const totalCount = isServerPaged
    ? Math.max(0, serverPagination?.total ?? 0)
    : filteredRows.length;
  const totalPages = getTotalPages(totalCount, activePageSize);

  useEffect(() => {
    if (isServerPaged) return;
    setPage(1);
  }, [search, filters, pageSize, rows.length, isServerPaged]);

  useEffect(() => {
    if (isServerPaged) return;
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, isServerPaged]);

  const paginatedRows = useMemo(() => {
    if (isServerPaged) return filteredRows;
    return paginateRows(filteredRows, activePage, activePageSize);
  }, [filteredRows, isServerPaged, activePage, activePageSize]);

  const start = totalCount === 0 ? 0 : (activePage - 1) * activePageSize + 1;
  const end = Math.min(
    activePage * activePageSize,
    isServerPaged ? totalCount : filteredRows.length,
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePageSizeChange = (nextSize: number) => {
    if (serverPagination) {
      serverPagination.onPageSizeChange(nextSize);
      return;
    }
    setPageSize(nextSize);
  };

  const handlePageChange = (nextPage: number) => {
    if (serverPagination) {
      serverPagination.onPageChange(nextPage);
      return;
    }
    setPage(nextPage);
  };

  const resetFilters = () => {
    setSearch("");
    setFilters(
      Object.fromEntries(
        filterFields
          .filter((field) => field.defaultValue)
          .map((field) => [field.key, field.defaultValue as string]),
      ),
    );
  };

  const hasActiveFilters =
    search.trim().length > 0 || Object.values(filters).some(Boolean);
  const colSpan = columns.length + 1 + (showRowActions ? 1 : 0);

  return (
    <div className="card">
      <div className="card-body">
        {title ? (
          <TableSectionHeader
            title={title}
            action={
              (actionLabel || extraActions) ? (
                <div className="flex items-center gap-2">
                  {extraActions}
                  {actionLabel ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={onAction}
                      disabled={loading}
                    >
                      <PlusCircle size={16} strokeWidth={2} />
                      {actionLabel}
                    </button>
                  ) : null}
                </div>
              ) : undefined
            }
          />
        ) : actionLabel || extraActions ? (
          <div className="toolbar toolbar-end flex items-center gap-2">
            {extraActions}
            {actionLabel ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onAction}
                disabled={loading}
              >
                <PlusCircle size={16} strokeWidth={2} />
                {actionLabel}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="table-filters-bar">
          <div className="table-filters-head">
            <span className="table-filters-title">{t("common.table.filters")}</span>
            {hasActiveFilters ? <ResetButton onClick={resetFilters} /> : null}
          </div>
          <div className="table-filters">
            <div className="table-filter-item table-filter-search">
              <label className="table-filter-label" htmlFor="table-search">
                {t("common.search")}
              </label>
              <div className="search-input">
                <Search size={15} className="search-input-icon" />
                <input
                  id="table-search"
                  placeholder={searchPlaceholder ?? t("common.table.searchPlaceholder")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={search ? "has-clear" : undefined}
                />
                {search ? (
                  <button
                    type="button"
                    className="search-clear-btn"
                    aria-label={t("common.table.clearSearch")}
                    onClick={() => setSearch("")}
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </div>
            {filterExtra}
            {filterFields.map((field) => {
              const options = field.options && field.options.length > 0
                ? field.options
                : getFilterOptions(rows, field.key);
              if (options.length === 0) return null;
              return (
                <div className="table-filter-item" key={field.key}>
                  <label className="table-filter-label" htmlFor={`filter-${field.key}`}>
                    {field.label}
                  </label>
                  <SearchableSelect
                    id={`filter-${field.key}`}
                    value={filters[field.key] ?? ""}
                    onChange={(nextValue) => handleFilterChange(field.key, nextValue)}
                    options={options}
                    placeholder={t("common.table.allLabel", { label: field.label })}
                    searchPlaceholder={t("common.table.searchLabel", {
                      label: field.label.toLowerCase(),
                    })}
                    allowEmpty
                    emptyLabel={t("common.table.allLabel", { label: field.label })}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="si-col">{t("common.table.siNo")}</th>
                {columns.map((column) => (
                  <th key={column.key}>{column.header}</th>
                ))}
                {showRowActions && <th className="action-col">{t("common.table.action")}</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr key={`table-skel-row-${rowIndex}`} aria-busy="true">
                    <td className="si-col">
                      <div className="ui-skeleton h-3.5 w-6 mx-auto rounded" />
                    </td>
                    {columns.map((column, colIndex) => (
                      <td key={`skel-cell-${column.key}-${colIndex}`}>
                        <div
                          className="ui-skeleton h-3.5 rounded"
                          style={{
                            width: `${45 + ((rowIndex * 17 + colIndex * 29) % 45)}%`,
                            minWidth: "35px",
                            maxWidth: "180px",
                          }}
                        />
                      </td>
                    ))}
                    {showRowActions && (
                      <td className="action-col">
                        <div className="flex items-center justify-center gap-2">
                          <div className="ui-skeleton w-6 h-6 rounded-md" />
                          <div className="ui-skeleton w-6 h-6 rounded-md" />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row, index) => (
                  <tr key={"id" in row ? String((row as { id?: string }).id) : JSON.stringify(row)}>
                    <td className="si-col">{(activePage - 1) * activePageSize + index + 1}</td>
                    {columns.map((column) => (
                      <td key={column.key}>{column.render(row)}</td>
                    ))}
                    {showRowActions && (
                      <td className="action-col">
                        {renderRowActions ? (
                          renderRowActions(row)
                        ) : (
                          <RowActions
                            row={row}
                            onEdit={onRowEdit}
                            onDelete={onRowDelete}
                            onActivate={onRowActivate}
                            statusToggle={statusToggle}
                            deleteConfirmTitle={deleteConfirmTitle}
                            deleteConfirmMessage={deleteConfirmMessage}
                            activateConfirmTitle={activateConfirmTitle}
                            activateConfirmMessage={activateConfirmMessage}
                            getDeleteLabel={getDeleteLabel}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr className="table-empty-row">
                  <td colSpan={colSpan}>
                    <TableEmptyState
                      icon={EmptyIcon}
                      title={emptyStateTitle}
                      message={
                        emptyStateMessage ??
                        (search || hasActiveFilters
                          ? t("common.table.emptyFiltered")
                          : t("common.table.emptyDefault"))
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="table-footer-left">
            <span className="table-result-text">
              {loading
                ? t("common.table.loadingRows")
                : t("common.table.showing", { start, end, total: totalCount })}
            </span>
            <div className="table-page-size">
              <label htmlFor="table-page-size">{t("common.table.rowsPerPage")}</label>
              <select
                id="table-page-size"
                className="form-control table-page-size-select"
                value={activePageSize}
                disabled={loading}
                onChange={(event) => handlePageSizeChange(Number(event.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-pagination">
            <button
              type="button"
              className="table-page-btn"
              disabled={loading || activePage <= 1}
              onClick={() => handlePageChange(Math.max(1, activePage - 1))}
              aria-label={t("common.table.previousPage")}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="table-page-indicator">
              {loading
                ? "—"
                : t("common.table.pageOf", { page: activePage, total: totalPages })}
            </span>
            <button
              type="button"
              className="table-page-btn"
              disabled={loading || activePage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, activePage + 1))}
              aria-label={t("common.table.nextPage")}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PersonCell({
  name,
  subtitle,
  avatar,
}: {
  name: string;
  subtitle?: string;
  avatar?: string;
}) {
  const [failed, setFailed] = useState(false);

  const src = useMemo(() => {
    if (!avatar) return "";
    const raw = String(avatar).trim();
    if (!raw || raw === "undefined" || raw === "null" || raw === "—") return "";
    return resolvePublicFileUrl(raw, "storage/employees/photos");
  }, [avatar]);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const initials = useMemo(() => {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [name]);

  return (
    <div className="user-cell">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={36}
          height={36}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-[var(--border)]"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <div className="avatar avatar-md avatar-soft-primary flex-shrink-0">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <div className="font-semibold truncate">{name}</div>
        {subtitle && <div className="text-xs text-muted truncate">{subtitle}</div>}
      </div>
    </div>
  );
}

export function SoftStatus({ value }: { value: string }) {
  const { language } = useI18n();
  const displayLabel = translateHrmsLookup(language, "labels", value);
  return <StatusBadge label={displayLabel} tone={statusTone(value)} />;
}

function humanizeFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function formatSimpleFieldValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  const text = String(value).trim();
  if (text === "true") return "Yes";
  if (text === "false") return "No";
  return text || "—";
}

/** Turn audit JSON into readable `Label: value` lines. */
export function formatJsonAsSimpleLines(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";

  let parsed: unknown = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "—" || trimmed === "-") return "";
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return "";
    return parsed
      .map((item, index) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const nested = formatJsonAsSimpleLines(item);
          return nested ? `[${index + 1}]\n${nested}` : `[${index + 1}]`;
        }
        return `${index + 1}. ${formatSimpleFieldValue(item)}`;
      })
      .join("\n");
  }

  if (!parsed || typeof parsed !== "object") {
    return formatSimpleFieldValue(parsed);
  }

  return Object.entries(parsed as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .map(([key, entry]) => `${humanizeFieldLabel(key)}: ${formatSimpleFieldValue(entry)}`)
    .join("\n");
}

function shortenPreview(text: string, maxLength = 42): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function ClampedText({
  text,
  preview,
  empty = "—",
  maxWidth = "14rem",
}: {
  text: string;
  /** Optional short label in the cell; defaults to truncated `text`. */
  preview?: string;
  empty?: string;
  maxWidth?: string;
}) {
  const value = text.trim();
  const previewText = (preview ?? value).trim();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placeAbove: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(Math.max(rect.width, 280), 420);
      const left = Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - width - 8),
      );
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < 180 && rect.top > spaceBelow;

      setCoords({
        top: placeAbove ? rect.top - 8 : rect.bottom + 8,
        left,
        width,
        placeAbove,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  if (!value && !previewText) return <>{empty}</>;

  const tooltip =
    open && coords ? (
      <span
        className="clamped-text-tooltip"
        role="tooltip"
        style={{
          top: coords.top,
          left: coords.left,
          width: coords.width,
          transform: coords.placeAbove ? "translateY(-100%)" : undefined,
        }}
      >
        {value || previewText}
      </span>
    ) : null;

  return (
    <>
      <span
        ref={triggerRef}
        className="clamped-text"
        style={{ maxWidth }}
        tabIndex={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span className="clamped-text-preview">{previewText || empty}</span>
      </span>
      {mounted && tooltip ? createPortal(tooltip, document.body) : null}
    </>
  );
}

/** Short cell + hover detail for JSON / audit old-new values. */
export function JsonClampedText({
  value,
  empty = "—",
  maxWidth = "12rem",
}: {
  value: unknown;
  empty?: string;
  maxWidth?: string;
}) {
  const detail = formatJsonAsSimpleLines(value);
  if (!detail) return <>{empty}</>;

  return (
    <ClampedText
      text={detail}
      preview={shortenPreview(detail)}
      empty={empty}
      maxWidth={maxWidth}
    />
  );
}
