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

export function SeriesNavigation({ prevPost, nextPost }: SeriesNavigationProps) {
  const { t } = useI18n();
  const localized = useLocalized();

  if (!prevPost && !nextPost) return null;

  return (
    <nav className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-4">
      {prevPost ? (
        <Link
          href={`/post/${prevPost.slug}`}
          className="flex-1 group p-4 rounded-xl border border-border/60 hover:border-accent/30 transition-colors"
        >
          <span className="text-xs text-text-tertiary">{t("series.prev")}</span>
          <p className="text-sm font-medium text-text-primary mt-1 group-hover:text-accent transition-colors">
            ← {localized(prevPost.title, prevPost.titleEn)}
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {nextPost ? (
        <Link
          href={`/post/${nextPost.slug}`}
          className="flex-1 group p-4 rounded-xl border border-border/60 hover:border-accent/30 transition-colors text-right"
        >
          <span className="text-xs text-text-tertiary">{t("series.next")}</span>
          <p className="text-sm font-medium text-text-primary mt-1 group-hover:text-accent transition-colors">
            {localized(nextPost.title, nextPost.titleEn)} →
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
