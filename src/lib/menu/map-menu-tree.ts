import type { MenuSubItem, MenuTreeItem } from "@/lib/api/types";
import type { NavChild, NavIcon, NavItem, NavSection } from "@/config/navigation";
import { isExactNavRoute, resolveAppRoute } from "@/lib/menu/route-map";

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

function resolveIcon(icon: string | null | undefined, label: string): NavIcon {
  const key = (icon || label).trim().toLowerCase().replace(/[\s_-]+/g, "");

  if (key.includes("org") || key.includes("branch") || key.includes("company")) {
    return "organization";
  }
  if (key.includes("employee") || key.includes("person") || key.includes("user") || key.includes("staff")) {
    return "employees";
  }
  if (key.includes("attend") || key.includes("clock") || key.includes("time") || key.includes("leave")) {
    return "attendance";
  }
  if (key.includes("payroll") || key.includes("salary") || key.includes("pay")) {
    return "payroll";
  }
  if (key.includes("report") || key.includes("analytics") || key.includes("chart")) {
    return "reports";
  }
  if (key.includes("setting") || key.includes("config")) {
    return "settings";
  }
  if (key.includes("help") || key.includes("support") || key.includes("ticket")) {
    return "helpdesk";
  }
  if (key.includes("ess") || key.includes("selfservice")) {
    return "ess";
  }
  return "dashboard";
}

function mapSubMenus(subMenus: MenuSubItem[] | undefined): NavChild[] {
  if (!Array.isArray(subMenus)) return [];

  const children: NavChild[] = [];
  for (const sub of subMenus) {
    const label = optionalText(sub.SubMenu_Name) ?? "Untitled";
    const href = resolveAppRoute(sub.Route, label);
    if (!href) continue;
    children.push({
      label,
      href,
      exact: isExactNavRoute(href),
    });
  }
  return children;
}

export function menuTreeToNavigation(tree: MenuTreeItem[]): NavSection[] {
  const items: NavItem[] = [];

  for (const menu of tree) {
    const label = optionalText(menu.Menu_Name) ?? "Untitled";
    const href = resolveAppRoute(menu.Route, label);
    const children = mapSubMenus(menu.SubMenus);
    const icon = resolveIcon(menu.Icon, label);

    if (children.length > 0) {
      items.push({ label, icon, children });
      continue;
    }

    if (href) {
      items.push({ label, href, icon });
    }
  }

  return [
    {
      title: "",
      icon: "dashboard",
      items,
    },
  ];
}
