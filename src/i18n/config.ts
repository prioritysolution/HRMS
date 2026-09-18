import type { AppLanguage } from "@/i18n/types";
export type { AppLanguage };

export const LANGUAGE_STORAGE_KEY = "priohrm-language";
export const DEFAULT_LANGUAGE: AppLanguage = "en";

export const LANGUAGE_OPTIONS: Array<{
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  shortLabel: string;
}> = [
  { code: "en", label: "English", nativeLabel: "English", shortLabel: "EN" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", shortLabel: "BN" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", shortLabel: "HI" },
  { code: "or", label: "Odia", nativeLabel: "ଓଡ଼ିଆ", shortLabel: "OR" },
];

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === "en" || value === "bn" || value === "hi" || value === "or";
}

export function saveLanguageCookie(language: AppLanguage) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${LANGUAGE_STORAGE_KEY}=${language}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {}
}

export function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isAppLanguage(saved)) return saved;

    const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_STORAGE_KEY}=([^;]*)`));
    if (match && isAppLanguage(match[1])) return match[1];
  } catch (e) {}
  return DEFAULT_LANGUAGE;
}

export function applyDocumentLanguage(language: AppLanguage) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.documentElement.setAttribute("data-language", language);
}
