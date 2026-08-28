"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
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
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TableEmptyState } from "@/components/ui/TableEmptyState";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { getRowLabel } from "@/lib/row-label";
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
  deleteConfirmTitle?: string;
  searchKeys?: string[];
  filterFields?: TableFilterDef[];
  defaultPageSize?: number;
  getDeleteLabel?: (row: T) => string;
  emptyStateIcon?: LucideIcon;
};

export function RowActions<T extends object>({
  row,
  onEdit,
  onDelete,
  deleteConfirmTitle,
  getDeleteLabel,
}: {
  row: T;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void | Promise<void>;
  deleteConfirmTitle?: string;
  getDeleteLabel?: (row: T) => string;
}) {
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rowLabel = getDeleteLabel?.(row) ?? getRowLabel(row);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(row);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }

      toast.success({
        title: "Deleted successfully",
        message: `"${rowLabel}" has been removed.`,
      });
      setConfirmOpen(false);
    } catch {
      toast.error({
        title: "Delete failed",
        message: "Something went wrong while deleting. Please try again.",
      });
    } finally {
      setDeleting(false);
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
        <button
          type="button"
          className="btn-action btn-action-delete"
          aria-label="Delete"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteConfirmTitle ?? "Delete record?"}
        message={`Are you sure you want to delete "${rowLabel}"?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
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
  deleteConfirmTitle,
  searchKeys,
  filterFields = [],
  defaultPageSize = 10,
  getDeleteLabel,
  emptyStateIcon: EmptyIcon = Inbox,
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
                <button type="button" className="btn btn-primary" onClick={onAction}>
                  <PlusCircle size={16} strokeWidth={2} />
                  {actionLabel}
                </button>
              ) : undefined
            }
          />
        ) : actionLabel ? (
          <div className="toolbar toolbar-end">
            <button type="button" className="btn btn-primary" onClick={onAction}>
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
              {paginatedRows.length > 0 ? (
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
                          deleteConfirmTitle={deleteConfirmTitle}
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
                      message={
                        search || hasActiveFilters
                          ? "Try adjusting your search or filters."
                          : "No data available in this list yet."
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
              Showing {start}-{end} of {filteredRows.length}
            </span>
            <div className="table-page-size">
              <label htmlFor="table-page-size">Rows per page</label>
              <select
                id="table-page-size"
                className="form-control table-page-size-select"
                value={pageSize}
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
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="table-page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="table-page-btn"
              disabled={page >= totalPages}
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
  return (
    <div className="user-cell">
      {avatar ? (
        <Image src={avatar} alt={name} width={36} height={36} />
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
