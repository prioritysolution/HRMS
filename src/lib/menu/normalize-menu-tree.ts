import type { MenuSubItem, MenuTreeItem } from "@/lib/api/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function isActiveStatus(value: unknown): boolean {
  if (value === 0 || value === "0" || value === false) return false;
  return true;
}

function readSubMenus(record: Record<string, unknown>): unknown[] {
  for (const key of ["SubMenus", "subMenus", "sub_menus", "Sub_Menus", "children"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeSubMenu(raw: unknown): MenuSubItem | null {
  const record = asRecord(raw);
  if (!record) return null;

  const status = record.Status ?? record.status;
  if (!isActiveStatus(status)) return null;

  const label =
    readString(record, ["SubMenu_Name", "sub_menu_name", "SubMenuName", "subMenuName", "name"]) ??
    "Untitled";

  return {
    Menu_Sl: readNumber(record, ["Menu_Sl", "menu_sl", "MenuSl", "menuSl"]) ?? 0,
    Menu_Id: readNumber(record, ["Menu_Id", "menu_id", "MenuId", "menuId"]) ?? 0,
    SubMenu_Id:
      readNumber(record, ["SubMenu_Id", "sub_menu_id", "SubMenuId", "subMenuId"]) ?? null,
    SubMenu_Name: label,
    Icon: readString(record, ["Icon", "icon"]),
    Route: readString(record, ["Route", "route", "Menu_Route", "menu_route", "Path", "path", "Url", "url"]),
    Status: typeof status === "number" ? status : 1,
  };
}

function normalizeMenuItem(raw: unknown): MenuTreeItem | null {
  const record = asRecord(raw);
  if (!record) return null;

  const status = record.Status ?? record.status;
  if (!isActiveStatus(status)) return null;

  const label =
    readString(record, ["Menu_Name", "menu_name", "MenuName", "menuName", "name"]) ?? "Untitled";

  const subMenus = readSubMenus(record)
    .map(normalizeSubMenu)
    .filter((item): item is MenuSubItem => item !== null)
    .sort((a, b) => {
      const orderA = a.SubMenu_Id ?? a.Menu_Sl;
      const orderB = b.SubMenu_Id ?? b.Menu_Sl;
      return orderA - orderB;
    });

  return {
    Menu_Sl: readNumber(record, ["Menu_Sl", "menu_sl", "MenuSl", "menuSl"]) ?? 0,
    Menu_Id: readNumber(record, ["Menu_Id", "menu_id", "MenuId", "menuId"]) ?? 0,
    Menu_Name: label,
    Icon: readString(record, ["Icon", "icon"]),
    Route: readString(record, ["Route", "route", "Menu_Route", "menu_route", "Path", "path", "Url", "url"]),
    Status: typeof status === "number" ? status : 1,
    SubMenus: subMenus.length > 0 ? subMenus : undefined,
  };
}

/** Normalize menu tree API payloads into a stable shape for navigation mapping. */
export function normalizeMenuTree(payload: unknown): MenuTreeItem[] {
  const rows = Array.isArray(payload)
    ? payload
    : asRecord(payload) && Array.isArray((payload as { data?: unknown }).data)
      ? ((payload as { data: unknown[] }).data ?? [])
      : [];

  return rows
    .map(normalizeMenuItem)
    .filter((item): item is MenuTreeItem => item !== null)
    .sort((a, b) => a.Menu_Sl - b.Menu_Sl);
}
