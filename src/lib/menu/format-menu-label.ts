export type MenuLabelParts = {
  /** English (or primary) label used for keys, routes, and top line */
  label: string;
  /** Localized label shown under English when language ≠ EN */
  labelSecondary?: string;
};

/**
 * Menu label display:
 * - English (EN): primary only
 * - Other languages: English on top, localized underneath
 */
export function formatMenuLabel(
  englishName: string | null | undefined,
  localizedName: string | null | undefined,
  langCode?: string | null,
): MenuLabelParts {
  const english = typeof englishName === "string" ? englishName.trim() : "";
  const localized = typeof localizedName === "string" ? localizedName.trim() : "";
  const code = (langCode ?? "EN").trim().toUpperCase();
  const isEnglish = !code || code === "EN";

  const primary = english || localized || "Untitled";

  if (isEnglish) {
    return { label: primary };
  }

  if (english && localized && english !== localized) {
    return { label: english, labelSecondary: localized };
  }

  return { label: primary };
}

/** App language (`en`/`bn`/…) → API `Lang_Code` (`EN`/`BN`/…). */
export function toMenuLangCode(language: string | null | undefined): string {
  const code = (language ?? "en").trim().toUpperCase();
  if (code === "BN" || code === "HI" || code === "OR" || code === "EN") {
    return code;
  }
  return "EN";
}
