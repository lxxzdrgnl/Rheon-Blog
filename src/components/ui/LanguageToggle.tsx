"use client";

import { useI18n } from "@/i18n/provider";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-bg-card transition-colors text-text-secondary"
    >
      {locale === "ko" ? "EN" : "한"}
    </button>
  );
}
