import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { MenuListItem, MenuTreeItem, MenuTreeQuery } from "@/lib/api/types";

function withQuery(basePath: string, query?: MenuTreeQuery & { menu_id?: number }) {
  const params = new URLSearchParams();
  if (query?.status !== undefined) params.set("status", String(query.status));
  if (query?.menu_id !== undefined) params.set("menu_id", String(query.menu_id));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return `${basePath}${suffix}`;
}

function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

export const menuService = {
  list: async (query?: MenuTreeQuery & { menu_id?: number }) => {
    const payload = await apiClient.get<unknown>(withQuery(API_ENDPOINTS.menu.list, query));
    return asArray<MenuListItem>(payload);
  },

  tree: async (query?: MenuTreeQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.menu.tree, { status: query?.status ?? 1 }),
    );
    return asArray<MenuTreeItem>(payload);
  },

  get: (id: string | number) => apiClient.get<MenuListItem>(API_ENDPOINTS.menu.get(id)),

  getByMenu: (menuId: string | number, subMenuId?: string | number) =>
    apiClient.get<MenuListItem>(API_ENDPOINTS.menu.getByMenu(menuId, subMenuId)),
};
