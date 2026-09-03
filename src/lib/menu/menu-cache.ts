import type { NavSection } from "@/config/navigation";
import { getAuthTokenKey } from "@/lib/env";

export function getMenuCacheKey(): string {
  return `${getAuthTokenKey()}_menu`;
}

export function readMenuCache(): NavSection[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getMenuCacheKey());
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    
    return parsed as NavSection[];
  } catch (err) {
    console.error("Failed to read menu cache", err);
    return null;
  }
}

export function writeMenuCache(sections: NavSection[]): void {
  if (typeof window === "undefined") return;
  if (!Array.isArray(sections) || sections.length === 0) return;
  
  try {
    localStorage.setItem(getMenuCacheKey(), JSON.stringify(sections));
  } catch (err) {
    console.error("Failed to write menu cache", err);
  }
}

export function clearMenuCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getMenuCacheKey());
  } catch (err) {
    console.error("Failed to clear menu cache", err);
  }
}
