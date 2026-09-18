import type { AppLanguage } from "@/i18n/types";
import { DEFAULT_LANGUAGE } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type HrmsLookupGroup = "titles" | "sections" | "actions" | "headers" | "labels";

function readHrmsGroup(
  language: AppLanguage,
  group: HrmsLookupGroup,
): Record<string, string> | undefined {
  const hrms = getDictionary(language).hrms;
  if (!hrms || typeof hrms !== "object") return undefined;
  const map = (hrms as Record<string, unknown>)[group];
  if (!map || typeof map !== "object") return undefined;
  return map as Record<string, string>;
}

/** Translate HRMS config English text. Falls back to original. */
export function translateHrmsLookup(
  language: AppLanguage,
  group: HrmsLookupGroup,
  text: string,
): string {
  if (!text) return text;
  const trimmed = text.trim();
  const map = readHrmsGroup(language, group);
  if (map) {
    if (map[trimmed]) return map[trimmed];
    const lower = trimmed.toLowerCase();
    const foundKey = Object.keys(map).find((k) => k.toLowerCase() === lower);
    if (foundKey && map[foundKey]) return map[foundKey];
  }
  if (group === "headers") {
    const labelMap = readHrmsGroup(language, "labels");
    if (labelMap) {
      if (labelMap[trimmed]) return labelMap[trimmed];
      const lower = trimmed.toLowerCase();
      const foundKey = Object.keys(labelMap).find((k) => k.toLowerCase() === lower);
      if (foundKey && labelMap[foundKey]) return labelMap[foundKey];
    }
    const titleMap = readHrmsGroup(language, "titles");
    if (titleMap) {
      if (titleMap[trimmed]) return titleMap[trimmed];
      const lower = trimmed.toLowerCase();
      const foundKey = Object.keys(titleMap).find((k) => k.toLowerCase() === lower);
      if (foundKey && titleMap[foundKey]) return titleMap[foundKey];
    }
  }
  if (group === "labels") {
    const headerMap = readHrmsGroup(language, "headers");
    if (headerMap) {
      if (headerMap[trimmed]) return headerMap[trimmed];
      const lower = trimmed.toLowerCase();
      const foundKey = Object.keys(headerMap).find((k) => k.toLowerCase() === lower);
      if (foundKey && headerMap[foundKey]) return headerMap[foundKey];
    }
    const titleMap = readHrmsGroup(language, "titles");
    if (titleMap) {
      if (titleMap[trimmed]) return titleMap[trimmed];
      const lower = trimmed.toLowerCase();
      const foundKey = Object.keys(titleMap).find((k) => k.toLowerCase() === lower);
      if (foundKey && titleMap[foundKey]) return titleMap[foundKey];
    }
  }
  if (language !== DEFAULT_LANGUAGE) {
    const fallbackMap = readHrmsGroup(DEFAULT_LANGUAGE, group);
    if (fallbackMap) {
      if (fallbackMap[trimmed]) return fallbackMap[trimmed];
    }
  }
  return text;
}
