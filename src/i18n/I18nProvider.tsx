"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LANGUAGE_OPTIONS,
  LANGUAGE_STORAGE_KEY,
  applyDocumentLanguage,
  readStoredLanguage,
  saveLanguageCookie,
} from "@/i18n/config";
import { translate } from "@/i18n/dictionaries";
import type { AppLanguage, TranslationParams } from "@/i18n/types";

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, params?: TranslationParams) => string;
  options: typeof LANGUAGE_OPTIONS;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage?: AppLanguage;
}) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== "undefined") {
      return readStoredLanguage();
    }
    return initialLanguage || "en";
  });

  useEffect(() => {
    applyDocumentLanguage(language);
    saveLanguageCookie(language);
  }, [language]);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      } catch (e) {}
    }
    saveLanguageCookie(next);
    applyDocumentLanguage(next);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(language, key, params),
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      options: LANGUAGE_OPTIONS,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

/** Shortcut for components that only need the translator. */
export function useT() {
  return useI18n().t;
}
