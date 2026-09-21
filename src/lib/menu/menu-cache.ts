import type { NavSection } from "@/config/navigation";
import { getAuthTokenKey } from "@/lib/env";
import { toMenuLangCode } from "@/lib/menu/format-menu-label";

export function getMenuCacheKey(langCode?: string | null): string {
  const lang = toMenuLangCode(langCode);
  return `${getAuthTokenKey()}_menu_${lang}`;
}

export function readMenuCache(langCode?: string | null): NavSection[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getMenuCacheKey(langCode));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed as NavSection[];
  } catch (err) {
    console.error("Failed to read menu cache", err);
    return null;
  }
}

export function writeMenuCache(sections: NavSection[], langCode?: string | null): void {
  if (typeof window === "undefined") return;
  if (!Array.isArray(sections) || sections.length === 0) return;

  try {
    localStorage.setItem(getMenuCacheKey(langCode), JSON.stringify(sections));
  } catch (err) {
    console.error("Failed to write menu cache", err);
  }
}

export function clearMenuCache(): void {
  if (typeof window === "undefined") return;
  try {
    const prefix = `${getAuthTokenKey()}_menu`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && (key === prefix || key.startsWith(`${prefix}_`))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.error("Failed to clear menu cache", err);
  }
}
