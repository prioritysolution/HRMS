import type { AppLanguage } from "@/i18n/types";
import { DEFAULT_LANGUAGE } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type StatField = "title" | "hint" | "description" | "change";

function readStats(
  language: AppLanguage,
  namespace: "leave" | "attendance" | "payroll",
): Record<string, Partial<Record<StatField, string>>> | undefined {
  const root = getDictionary(language)[namespace];
  if (!root || typeof root !== "object") return undefined;
  const stats = (root as Record<string, unknown>).stats;
  if (!stats || typeof stats !== "object") return undefined;
  return stats as Record<string, Partial<Record<StatField, string>>>;
}

function lookupStat(
  language: AppLanguage,
  namespace: "leave" | "attendance" | "payroll",
  englishTitle: string,
  field: StatField,
): string | undefined {
  const primary = readStats(language, namespace)?.[englishTitle]?.[field];
  if (primary) return primary;
  if (language !== DEFAULT_LANGUAGE) {
    return readStats(DEFAULT_LANGUAGE, namespace)?.[englishTitle]?.[field];
  }
  return undefined;
}

/** Translate leave, attendance, or payroll stat card English title/hint/description/change. */
export function translateModuleStat(
  language: AppLanguage,
  englishTitle: string,
  field: StatField,
  fallback: string,
  preferredNamespace?: "leave" | "attendance" | "payroll",
): string {
  if (!englishTitle) return fallback;
  const order: Array<"leave" | "attendance" | "payroll"> = preferredNamespace
    ? [
        preferredNamespace,
        ...((["payroll", "leave", "attendance"] as const).filter(
          (ns) => ns !== preferredNamespace,
        )),
      ]
    : ["payroll", "leave", "attendance"];

  for (const ns of order) {
    const lookedUp = lookupStat(language, ns, englishTitle, field);
    if (lookedUp) {
      if (
        field === "change" &&
        (lookedUp.includes("{count}") || lookedUp.includes("{amount}"))
      ) {
        const match = fallback.match(/^(₹?[\d,]+(?:\.\d+)?)/);
        const val = match ? match[1] : "0";
        return lookedUp.replace(/{count}/g, val).replace(/{amount}/g, val);
      }
      return lookedUp;
    }
  }
  return fallback;
}

/** @deprecated Prefer translateModuleStat */
export function translateLeaveStat(
  language: AppLanguage,
  englishTitle: string,
  field: StatField,
  fallback: string,
): string {
  return translateModuleStat(language, englishTitle, field, fallback);
}

/** @deprecated Prefer translateModuleStat */
export function translateAttendanceStat(
  language: AppLanguage,
  englishTitle: string,
  field: StatField,
  fallback: string,
): string {
  return translateModuleStat(language, englishTitle, field, fallback);
}
