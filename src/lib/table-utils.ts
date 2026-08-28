export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;

export type TableFilterDef = {
  key: string;
  label: string;
};

export function getFilterOptions<T extends object>(rows: T[], key: string): string[] {
  const values = new Set<string>();
  rows.forEach((row) => {
    const value = (row as Record<string, unknown>)[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      values.add(String(value));
    }
  });
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export function applyTableSearch<T extends object>(
  rows: T[],
  query: string,
  searchKeys: string[],
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;

  return rows.filter((row) =>
    searchKeys.some((key) =>
      String((row as Record<string, unknown>)[key] ?? "")
        .toLowerCase()
        .includes(normalized),
    ),
  );
}

export function applyTableFilters<T extends object>(
  rows: T[],
  filters: Record<string, string>,
): T[] {
  return rows.filter((row) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return String((row as Record<string, unknown>)[key] ?? "") === value;
    }),
  );
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function getTotalPages(totalRows: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalRows / pageSize));
}
