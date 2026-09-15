/** Shared helpers for APIs that return `{ items, meta }` list payloads. */

export type ApiListMeta = {
  total?: number;
  page?: number;
  per_page?: number;
  last_page?: number;
  has_more?: boolean;
};

export type PaginatedListResult<T> = {
  items: T[];
  meta: ApiListMeta | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Accepts either:
 * - unwrapped `{ items, meta }` (apiClient default unwrap)
 * - full `{ success, data: { items, meta } }`
 * - legacy plain arrays / `{ data: [] }`
 */
export function extractPaginatedList<T>(payload: unknown): PaginatedListResult<T> {
  if (Array.isArray(payload)) {
    return { items: payload as T[], meta: null };
  }

  const root = asRecord(payload);
  if (!root) return { items: [], meta: null };

  if (Array.isArray(root.items)) {
    return {
      items: root.items as T[],
      meta: (asRecord(root.meta) as ApiListMeta | null) ?? null,
    };
  }

  const nested = asRecord(root.data);
  if (nested && Array.isArray(nested.items)) {
    return {
      items: nested.items as T[],
      meta: (asRecord(nested.meta) as ApiListMeta | null) ?? null,
    };
  }

  if (Array.isArray(root.data)) {
    return { items: root.data as T[], meta: null };
  }

  return { items: [], meta: null };
}

export function isMetaHasMore(meta: ApiListMeta | null, page: number): boolean {
  if (!meta) return false;
  if (typeof meta.has_more === "boolean") return meta.has_more;
  if (typeof meta.last_page === "number") return page < meta.last_page;
  return false;
}
