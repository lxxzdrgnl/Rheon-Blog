"use client";

import { useI18n } from "@/i18n/provider";

export function SeriesEmpty() {
  const { t } = useI18n();
  return <p className="py-16 text-center text-sm text-text-tertiary">{t("series.empty")}</p>;
}
