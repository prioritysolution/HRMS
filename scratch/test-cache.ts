import { navigation } from "../src/config/navigation";

function isNavSectionArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((section) => section && typeof section === "object");
}

function readMenuCacheMock(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isNavSectionArray(parsed) || (parsed as any).length === 0) return null;
    const first = (parsed as any)[0] as { items?: unknown };
    if (!Array.isArray(first.items) || first.items.length === 0) return null;
    return parsed;
  } catch (e) {
    console.error("Parse error:", e);
    return null;
  }
}

const raw = JSON.stringify(navigation);
console.log("Raw length:", raw.length);
const result = readMenuCacheMock(raw);
console.log("Result is null?", result === null);
