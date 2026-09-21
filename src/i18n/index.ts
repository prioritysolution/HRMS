export type { AppLanguage, TranslationParams } from "@/i18n/types";
export {
  DEFAULT_LANGUAGE,
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  applyDocumentLanguage,
  isAppLanguage,
  readStoredLanguage,
} from "@/i18n/config";
export { getDictionary, translate } from "@/i18n/dictionaries";
export { I18nProvider, useI18n, useT } from "@/i18n/I18nProvider";
export {
  translateEssLookup,
  translateEssDescription,
  translateEssEmpty,
  translateGreeting,
  translateMonthName,
  translateDayOfWeek,
  formatLocalizedDateString,
  translateAttendanceStatus,
} from "@/i18n/ess";
export { translateHrmsLookup } from "@/i18n/hrms";
export {
  translateModuleStat,
  translateLeaveStat,
  translateAttendanceStat,
} from "@/i18n/stats";
