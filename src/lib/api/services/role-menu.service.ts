import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  RoleMenuListQuery,
  RoleMenuMatrixItem,
  RoleMenuMatrixQuery,
  RoleMenuRecord,
  RoleMenuSyncPayload,
  RoleMenuWritePayload,
} from "@/lib/api/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function optionalText(value: unknown): string {
  if (value === undefined || value === null || value === false) return "";
  return String(value).trim();
}

function toFlag(value: unknown): 0 | 1 {
  if (value === 0 || value === "0" || value === false || value === "false") return 0;
  if (value === 1 || value === "1" || value === true || value === "true") return 1;
  return 0;
}

function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as T[];
  return [];
}

function asOne<T>(payload: unknown): T {
  const record = asRecord(payload);
  const nested = record ? asRecord(record.data) : null;
  return (nested ?? record ?? payload) as T;
}

function withQuery(basePath: string, query?: RoleMenuListQuery | RoleMenuMatrixQuery) {
  const params = new URLSearchParams();
  if (!query) return basePath;

  if ("id" in query && query.id !== undefined) params.set("id", String(query.id));
  if ("role_menu_id" in query && query.role_menu_id !== undefined) {
    params.set("role_menu_id", String(query.role_menu_id));
  }
  if (query.role_id !== undefined) params.set("role_id", String(query.role_id));
  if ("menu_sl" in query && query.menu_sl !== undefined) {
    params.set("menu_sl", String(query.menu_sl));
  }
  if (query.status !== undefined) params.set("status", String(query.status));

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export type RoleMenuMatrixRow = {
  menuSl: number;
  menuId: number;
  menuName: string;
  subMenuId: number | null;
  subMenuName: string;
  label: string;
  route: string;
  icon: string;
  isAssigned: boolean;
  roleMenuId: number | null;
  isAdmin: boolean;
};

export function normalizeMatrixItem(item: RoleMenuMatrixItem): RoleMenuMatrixRow | null {
  const source = item as unknown as Record<string, unknown>;
  const menuSl = Number(readValue(source, ["Menu_Sl", "menu_sl"]) ?? 0);
  if (!menuSl) return null;

  const menuId = Number(readValue(source, ["Menu_Id", "menu_id"]) ?? menuSl);
  const menuName = optionalText(readValue(source, ["Menu_Name", "menu_name"])) || "Menu";
  const subMenuIdRaw = readValue(source, ["SubMenu_Id", "sub_menu_id"]);
  const subMenuId =
    subMenuIdRaw === undefined || subMenuIdRaw === null || subMenuIdRaw === ""
      ? null
      : Number(subMenuIdRaw);
  const subMenuName = optionalText(readValue(source, ["SubMenu_Name", "sub_menu_name"]));
  const roleMenuIdRaw = readValue(source, ["Role_Menu_Id", "role_menu_id"]);

  return {
    menuSl,
    menuId,
    menuName,
    subMenuId: Number.isFinite(subMenuId) ? subMenuId : null,
    subMenuName,
    label: subMenuName || menuName,
    route: optionalText(readValue(source, ["Route", "route"])),
    icon: optionalText(readValue(source, ["Icon", "icon"])),
    isAssigned: toFlag(readValue(source, ["Is_Assigned", "is_assigned"])) === 1,
    roleMenuId:
      roleMenuIdRaw === undefined || roleMenuIdRaw === null || roleMenuIdRaw === ""
        ? null
        : Number(roleMenuIdRaw),
    isAdmin: toFlag(readValue(source, ["Is_Admin", "is_admin"])) === 1,
  };
}

export type RoleMenuMatrixGroup = {
  menuId: number;
  menuName: string;
  items: RoleMenuMatrixRow[];
};

export function groupMatrixRows(rows: RoleMenuMatrixRow[]): RoleMenuMatrixGroup[] {
  const groups = new Map<number, RoleMenuMatrixGroup>();

  for (const row of rows) {
    const existing = groups.get(row.menuId);
    if (existing) {
      existing.items.push(row);
      continue;
    }
    groups.set(row.menuId, {
      menuId: row.menuId,
      menuName: row.menuName,
      items: [row],
    });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    items: [...group.items].sort((a, b) => {
      const aParent = a.subMenuId == null ? 0 : 1;
      const bParent = b.subMenuId == null ? 0 : 1;
      if (aParent !== bParent) return aParent - bParent;
      return a.label.localeCompare(b.label);
    }),
  }));
}

export const roleMenuService = {
  list: async (query?: RoleMenuListQuery) => {
    const payload = await apiClient.get<unknown>(withQuery(API_ENDPOINTS.roleMenu.list, query));
    return asList<RoleMenuRecord>(payload);
  },

  matrix: async (query: RoleMenuMatrixQuery) => {
    const payload = await apiClient.get<unknown>(
      withQuery(API_ENDPOINTS.roleMenu.matrix, {
        role_id: query.role_id,
        status: query.status ?? 1,
      }),
    );
    return asList<RoleMenuMatrixItem>(payload)
      .map(normalizeMatrixItem)
      .filter((row): row is RoleMenuMatrixRow => row !== null);
  },

  create: async (body: RoleMenuWritePayload) => {
    const payload = await apiClient.post<unknown>(API_ENDPOINTS.roleMenu.create, body);
    return asOne<RoleMenuRecord>(payload);
  },

  update: async (id: string | number, body: RoleMenuWritePayload) => {
    const payload = await apiClient.put<unknown>(API_ENDPOINTS.roleMenu.update(id), body);
    return asOne<RoleMenuRecord>(payload);
  },

  remove: (id: string | number) =>
    apiClient.delete<{ success?: boolean; message?: string; data?: null }>(
      API_ENDPOINTS.roleMenu.delete(id),
      { unwrap: false },
    ),

  sync: async (body: RoleMenuSyncPayload) => {
    const payload = await apiClient.post<unknown>(API_ENDPOINTS.roleMenu.sync, {
      role_id: body.role_id,
      menu_sls: body.menu_sls ?? [],
      ...(body.created_by !== undefined ? { created_by: body.created_by } : {}),
    });
    return asList<RoleMenuRecord>(payload);
  },
};
