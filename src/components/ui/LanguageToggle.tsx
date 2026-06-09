"use client";

import { useRouter, usePathname } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { isLocale, swapLocaleInPath } from "@/lib/locale";

export function LanguageToggle() {
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  // 비-locale 경로(admin 등)에서는 토글을 숨긴다
  if (!isLocale(pathname.split("/")[1])) return null;

  const other = locale === "ko" ? "en" : "ko";
  const handleToggle = () => {
    document.cookie = `NEXT_LOCALE=${other}; path=/; max-age=31536000`;
    // usePathname은 쿼리/해시를 안 담으므로 직접 보존(?tab=series 등 유지)
    const suffix = typeof window !== "undefined" ? window.location.search + window.location.hash : "";
    router.push(swapLocaleInPath(pathname, other) + suffix, { scroll: false }); // 스크롤 유지
  };

  return (
    <button
      onClick={handleToggle}
      className="px-2 py-1 rounded-md text-xs font-medium hover:bg-bg-elevated transition-colors text-text-tertiary hover:text-accent tracking-wide"
    >
      {locale === "ko" ? "KR" : "EN"}
    </button>
  );
}
