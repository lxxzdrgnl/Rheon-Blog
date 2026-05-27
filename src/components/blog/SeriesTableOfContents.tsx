"use client";

import { useState } from "react";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useI18n, useLocalized } from "@/i18n/provider";

interface SeriesPost {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
}

interface SeriesTableOfContentsProps {
  seriesTitle: string;
  seriesTitleEn: string | null;
  posts: SeriesPost[];
  currentPostId: number;
}

export function SeriesTableOfContents({ seriesTitle, seriesTitleEn, posts, currentPostId }: SeriesTableOfContentsProps) {
  const { t } = useI18n();
  const localized = useLocalized();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-6 rounded-xl border border-border/60 bg-bg-elevated/50 overflow-hidden animate-fade-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg-elevated transition-colors"
      >
        <div>
          <span className="text-xs text-accent font-medium uppercase tracking-wider">{t("series.title")}</span>
          <h3 className="font-semibold text-text-primary mt-0.5">{localized(seriesTitle, seriesTitleEn)}</h3>
        </div>
        <svg
          className={`w-4 h-4 text-text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <ol className="px-5 pb-4 space-y-1">
          {posts.map((post, idx) => {
            const isCurrent = post.id === currentPostId;
            return (
              <li key={post.id}>
                {isCurrent ? (
                  <span className="flex items-baseline gap-2.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-sm font-medium">
                    <span className="text-xs text-accent/60">{idx + 1}.</span>
                    {localized(post.title, post.titleEn)}
                  </span>
                ) : (
                  <Link
                    href={`/post/${post.slug}`}
                    className="flex items-baseline gap-2.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                  >
                    <span className="text-xs text-text-tertiary">{idx + 1}.</span>
                    {localized(post.title, post.titleEn)}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
