"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale, TFn } from "@/lib/i18n";
import { tFor, DEFAULT_LOCALE } from "@/lib/i18n";

type I18nValue = { locale: Locale; t: TFn };

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  t: tFor(DEFAULT_LOCALE),
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nValue>(() => ({ locale, t: tFor(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): TFn {
  return useContext(I18nContext).t;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}
