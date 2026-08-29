"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
  ACTIVATE_CONFIRM_MESSAGE,
  DEACTIVATE_CONFIRM_MESSAGE,
  formatConfirmMessage,
} from "@/lib/confirm-messages";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TableEmptyState } from "@/components/ui/TableEmptyState";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { resolvePublicFileUrl } from "@/lib/env";
import { TABLE_LOADING_LABEL } from "@/lib/table-loading";
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

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  title?: string;
  searchPlaceholder?: string;
  actionLabel?: string;
  onAction?: () => void;
  showRowActions?: boolean;
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
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(false);
  const rowLabel = getDeleteLabel?.(row) ?? getRowLabel(row);
  const inactive = statusToggle && isRowInactive(row);
  const isDeactivateAction = deleteConfirmTitle?.toLowerCase().includes("deactivate");

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(row);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }

      toast.success({
        title: isDeactivateAction ? "Deactivated successfully" : "Deleted successfully",
        message: isDeactivateAction
          ? `"${rowLabel}" has been set to Inactive.`
          : `"${rowLabel}" has been removed.`,
      });
      setConfirmOpen(false);
    } catch (error) {
      toast.error({
        title: isDeactivateAction ? "Deactivate failed" : "Delete failed",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while deleting. Please try again.",
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
        title: "Activated successfully",
        message: `"${rowLabel}" has been set to Active.`,
      });
      setActivateOpen(false);
    } catch (error) {
      toast.error({
        title: "Activate failed",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while activating. Please try again.",
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <>
      <div className="table-actions">
        <button
          type="button"
          className="btn-action btn-action-edit"
          aria-label="Edit"
          onClick={() => onEdit?.(row)}
        >
          <SquarePen size={16} strokeWidth={2.25} />
        </button>
        {inactive ? (
          <button
            type="button"
            className="btn-action btn-action-activate"
            aria-label="Activate"
            onClick={() => setActivateOpen(true)}
          >
            <CircleCheck size={16} strokeWidth={2.25} />
          </button>
        ) : (
          <button
            type="button"
            className="btn-action btn-action-delete"
            aria-label={isDeactivateAction ? "Deactivate" : "Delete"}
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
        title={deleteConfirmTitle ?? "Delete record?"}
        message={
          deleteConfirmMessage
            ? formatConfirmMessage(deleteConfirmMessage, rowLabel)
            : isDeactivateAction
              ? formatConfirmMessage(DEACTIVATE_CONFIRM_MESSAGE, rowLabel)
              : `Are you sure you want to delete "${rowLabel}"?`
        }
        confirmLabel={isDeactivateAction ? "Deactivate" : "Delete"}
        variant="danger"
        loading={deleting}
      />

      <ConfirmDialog
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        onConfirm={handleConfirmActivate}
        title={activateConfirmTitle ?? "Activate record?"}
        message={formatConfirmMessage(activateConfirmMessage ?? ACTIVATE_CONFIRM_MESSAGE, rowLabel)}
        confirmLabel="Activate"
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
  searchPlaceholder = "Search...",
  actionLabel,
  onAction,
  showRowActions = false,
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
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const resolvedSearchKeys = useMemo(
    () => searchKeys ?? columns.map((column) => column.key),
    [searchKeys, columns],
  );

  const filteredRows = useMemo(() => {
    const searched = applyTableSearch(rows, search, resolvedSearchKeys);
    return applyTableFilters(searched, filters);
  }, [rows, search, filters, resolvedSearchKeys]);

  const totalPages = getTotalPages(filteredRows.length, pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, filters, pageSize, rows.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(
    () => paginateRows(filteredRows, page, pageSize),
    [filteredRows, page, pageSize],
  );

  const start = filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, filteredRows.length);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setSearch("");
    setFilters({});
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
              actionLabel ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onAction}
                  disabled={loading}
                >
                  <PlusCircle size={16} strokeWidth={2} />
                  {actionLabel}
                </button>
              ) : undefined
            }
          />
        ) : actionLabel ? (
          <div className="toolbar toolbar-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onAction}
              disabled={loading}
            >
              <PlusCircle size={16} strokeWidth={2} />
              {actionLabel}
            </button>
          </div>
        ) : null}

        <div className="table-filters-bar">
          <div className="table-filters-head">
            <span className="table-filters-title">Filters</span>
            {hasActiveFilters ? <ResetButton onClick={resetFilters} /> : null}
          </div>
          <div className="table-filters">
            <div className="table-filter-item table-filter-search">
              <label className="table-filter-label" htmlFor="table-search">
                Search
              </label>
              <div className="search-input">
                <Search size={15} className="search-input-icon" />
                <input
                  id="table-search"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={search ? "has-clear" : undefined}
                />
                {search ? (
                  <button
                    type="button"
                    className="search-clear-btn"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </div>
            {filterFields.map((field) => {
              const options = getFilterOptions(rows, field.key);
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
                    placeholder={`All ${field.label}`}
                    searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
                    allowEmpty
                    emptyLabel={`All ${field.label}`}
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
                <th className="si-col">SI NO</th>
                {columns.map((column) => (
                  <th key={column.key}>{column.header}</th>
                ))}
                {showRowActions && <th className="action-col">Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="table-loading-row">
                  <td colSpan={colSpan}>
                    <div className="table-loading-panel">
                      <TableLoadingOverlay />
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row, index) => (
                  <tr key={"id" in row ? String((row as { id?: string }).id) : JSON.stringify(row)}>
                    <td className="si-col">{(page - 1) * pageSize + index + 1}</td>
                    {columns.map((column) => (
                      <td key={column.key}>{column.render(row)}</td>
                    ))}
                    {showRowActions && (
                      <td className="action-col">
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
                          ? "Try adjusting your search or filters."
                          : "No data available in this list yet.")
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
              {loading ? TABLE_LOADING_LABEL : `Showing ${start}-${end} of ${filteredRows.length}`}
            </span>
            <div className="table-page-size">
              <label htmlFor="table-page-size">Rows per page</label>
              <select
                id="table-page-size"
                className="form-control table-page-size-select"
                value={pageSize}
                disabled={loading}
                onChange={(event) => setPageSize(Number(event.target.value))}
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
              disabled={loading || page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="table-page-indicator">
              {loading ? "—" : `Page ${page} of ${totalPages}`}
            </span>
            <button
              type="button"
              className="table-page-btn"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              aria-label="Next page"
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
  const src = avatar ? resolvePublicFileUrl(avatar) : "";
  const isRemote = /^https?:\/\//i.test(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="user-cell">
      {src && !failed ? (
        isRemote ? (
          <img src={src} alt={name} width={36} height={36} onError={() => setFailed(true)} />
        ) : (
          <Image src={src} alt={name} width={36} height={36} onError={() => setFailed(true)} />
        )
      ) : (
        <div className="avatar avatar-md avatar-soft-primary">
          {name.slice(0, 1)}
        </div>
      )}
      <div>
        <div className="font-semibold">{name}</div>
        {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
      </div>
    </div>
  );
}

export function SoftStatus({ value }: { value: string }) {
  return <StatusBadge label={value} tone={statusTone(value)} />;
}
