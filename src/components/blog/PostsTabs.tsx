"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useI18n } from "@/i18n/provider";

/** /posts 내부 탭: 포스트 / 시리즈 (URL 쿼리 ?tab=series 기반) */
export function PostsTabs({ active }: { active: "posts" | "series" }) {
  const { t } = useI18n();

  const base = "px-5 py-2 rounded-lg text-[15px] transition-colors";
  const on = "border border-border bg-bg-elevated font-semibold text-accent";
  const off = "font-medium text-text-tertiary hover:text-text-primary";

  return (
    <nav className="flex items-center justify-center gap-2">
      <Link href="/posts" className={`${base} ${active === "posts" ? on : off}`}>
        {t("nav.posts")}
      </Link>
      <Link href="/posts?tab=series" className={`${base} ${active === "series" ? on : off}`}>
        {t("series.title")}
      </Link>
    </nav>
  );
}
