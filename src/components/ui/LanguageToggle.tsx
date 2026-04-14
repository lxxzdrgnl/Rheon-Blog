"use client";

import { useI18n } from "@/i18n/provider";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
      className="px-2 py-1 rounded-md text-xs font-medium hover:bg-bg-elevated transition-colors text-text-tertiary hover:text-text-primary tracking-wide"
    >
      {locale === "ko" ? "KR" : "EN"}
    </button>
  );
}
