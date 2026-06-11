"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useI18n, useLocalized } from "@/i18n/provider";

interface SeriesPost {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
}

interface SeriesNavigationProps {
  prevPost: SeriesPost | null;
  nextPost: SeriesPost | null;
}

const cardCls =
  "flex-1 min-w-0 group flex items-center gap-3 p-4 rounded-xl border border-border bg-bg-primary hover:border-accent/40 transition-colors";
const circleCls =
  "shrink-0 flex items-center justify-center w-9 h-9 rounded-full border border-accent/40 text-accent group-hover:bg-accent group-hover:text-bg-primary group-hover:border-accent transition-colors";

export function SeriesNavigation({ prevPost, nextPost }: SeriesNavigationProps) {
  const { t } = useI18n();
  const localized = useLocalized();

  if (!prevPost && !nextPost) return null;

  return (
    <nav className="flex flex-col sm:flex-row gap-4">
      {prevPost ? (
        <Link href={`/post/${prevPost.slug}`} className={cardCls}>
          <span className={circleCls}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-accent">{t("series.prev")}</span>
            <span className="block text-[15px] font-semibold text-text-primary mt-1 truncate group-hover:text-accent transition-colors">
              {localized(prevPost.title, prevPost.titleEn)}
            </span>
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block flex-1" />
      )}
      {nextPost ? (
        <Link href={`/post/${nextPost.slug}`} className={`${cardCls} text-right`}>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-accent">{t("series.next")}</span>
            <span className="block text-[15px] font-semibold text-text-primary mt-1 truncate group-hover:text-accent transition-colors">
              {localized(nextPost.title, nextPost.titleEn)}
            </span>
          </span>
          <span className={circleCls}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block flex-1" />
      )}
    </nav>
  );
}
