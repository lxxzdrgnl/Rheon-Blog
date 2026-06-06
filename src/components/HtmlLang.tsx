"use client";

import { useEffect } from "react";

// 루트 레이아웃의 <html lang="ko">를 현재 로케일로 갱신(화면낭독기 등 a11y).
export function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
