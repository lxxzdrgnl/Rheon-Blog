"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import type { Locale } from "./config";
import ko from "./messages/ko.json";
import en from "./messages/en.json";

const messages = { ko, en } as const;

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  // <html lang>은 루트 레이아웃 소유라 직접 못 바꿈 → 클라이언트에서 동기화
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: unknown = messages[locale];
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** 로케일에 따라 한국어/영어 값을 선택. 영어 값 없으면 한국어 폴백. */
export function useLocalized() {
  const { locale } = useI18n();
  return function localized<T>(ko: T, en: T | null | undefined): T {
    return locale === "en" && en ? en : ko;
  };
}
