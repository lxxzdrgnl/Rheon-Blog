"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/provider";
import { localizeHref } from "@/lib/locale";

interface SearchBarProps {
  /** 결과 페이지에서 현재 검색어를 미리 채워 둔다 */
  defaultValue?: string;
  /** "sm": 헤더용(기본), "lg": 검색 결과 페이지 히어로용 */
  size?: "sm" | "lg";
  autoFocus?: boolean;
  /** 검색 후(이동 후) 호출 — 모바일 메뉴 닫기 등 */
  onSubmit?: () => void;
}

export function SearchBar({ defaultValue = "", size = "sm", autoFocus = false, onSubmit }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const { t, locale } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(localizeHref(`/search?q=${encodeURIComponent(query.trim())}`, locale));
      onSubmit?.();
    }
  };

  const lg = size === "lg";

  return (
    <form onSubmit={handleSubmit} className="relative group/search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search.placeholder")}
        autoFocus={autoFocus}
        className={
          // nav 검색창과 동일한 채움(bg-bg-elevated)·무테두리 스타일을 크게 키운 변형 — 이질감 제거
          lg
            ? "w-full pl-11 pr-4 py-3 rounded-xl bg-bg-elevated text-text-primary text-base placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border transition-colors"
            : "w-full px-3 py-1.5 pl-8 rounded-md bg-bg-elevated text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border text-sm"
        }
      />
      <svg
        className={
          lg
            ? "absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-text-tertiary"
            : "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary"
        }
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </form>
  );
}
