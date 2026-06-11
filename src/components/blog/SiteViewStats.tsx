"use client";

import { useI18n } from "@/i18n/provider";

/** 사이드바 조회수 — 전체/오늘. 서버에서 받은 값을 즉시 렌더(트리와 동시). */
export function SiteViewStats({ total, today }: { total: number; today: number }) {
  const { locale } = useI18n();
  return (
    <div>
      <p className="text-sm font-bold mb-2.5">{locale === "en" ? "Views" : "조회수"}</p>
      <dl className="space-y-1 text-sm">
        <div className="flex items-baseline justify-between">
          <dt className="text-text-tertiary">Total</dt>
          <dd className="tabular-nums font-semibold text-text-primary">{total.toLocaleString()}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-text-tertiary">Today</dt>
          <dd className="tabular-nums font-semibold text-text-secondary">{today.toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  );
}
