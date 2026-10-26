import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SupportedLocale,
  getDirectionForLocale,
  resolveInitialLocale,
  translateDepartmentName,
  translateJobTitle,
  translateStatus,
  translateRole,
  translateLeaveType,
} from '../domain/rules';

interface LanguageContextValue {
  locale: SupportedLocale;
  isRtl: boolean;
  setLocale: (loc: SupportedLocale) => void;
  toggleLocale: () => void;
  t: (en: string, ar: string) => string;
  trDept: (name: string | undefined) => string;
  trTitle: (title: string | undefined) => string;
  trStatus: (status: string | undefined) => string;
  trRole: (role: string | undefined) => string;
  trLeaveType: (name: string | undefined) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LANG_STORAGE_KEY = 'nexahr_lang_v2';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      const resolved = resolveInitialLocale(urlLang, savedLang);
      localStorage.setItem(LANG_STORAGE_KEY, resolved);
      return resolved;
    }
    return 'ar';
  });

  const isRtl = getDirectionForLocale(locale) === 'rtl';

  useEffect(() => {
    const dir = getDirectionForLocale(locale);
    document.documentElement.dir = dir;
    document.documentElement.lang = locale === 'ar' ? 'ar-EG' : 'en';
    localStorage.setItem(LANG_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((loc: SupportedLocale) => {
    setLocaleState(loc);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  const t = useCallback(
    (en: string, ar: string) => {
      return locale === 'ar' ? ar : en;
    },
    [locale]
  );

  const trDept = useCallback(
    (name: string | undefined) => translateDepartmentName(name, locale),
    [locale]
  );

  const trTitle = useCallback(
    (title: string | undefined) => translateJobTitle(title, locale),
    [locale]
  );

  const trStatus = useCallback(
    (status: string | undefined) => translateStatus(status, locale),
    [locale]
  );

  const trRole = useCallback(
    (role: string | undefined) => translateRole(role, locale),
    [locale]
  );

  const trLeaveType = useCallback(
    (name: string | undefined) => translateLeaveType(name, locale),
    [locale]
  );

  return (
    <LanguageContext.Provider
      value={{
        locale,
        isRtl,
        setLocale,
        toggleLocale,
        t,
        trDept,
        trTitle,
        trStatus,
        trRole,
        trLeaveType,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
