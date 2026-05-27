"use client";

import { useI18n, useLocalized } from "@/i18n/provider";
import { PostCard } from "@/components/blog/PostCard";

interface SeriesDetailClientProps {
  series: { title: string; titleEn: string | null; description: string | null; descriptionEn: string | null };
  posts: {
    id: number; title: string; titleEn: string | null; slug: string;
    thumbnail: string | null; createdAt: string;
    categoryName: string; categoryNameEn: string;
    tags?: { name: string; nameEn: string }[];
  }[];
}

export function SeriesDetailClient({ series, posts }: SeriesDetailClientProps) {
  const { t } = useI18n();
  const localized = useLocalized();

  return (
    <div className="page-container py-16">
      <header className="mb-12">
        <span className="text-xs text-accent font-medium uppercase tracking-wider">{t("series.title")}</span>
        <h1 className="text-2xl md:text-4xl font-bold leading-tight mt-2">
          {localized(series.title, series.titleEn)}
        </h1>
        {series.description && (
          <p className="text-text-secondary mt-4 max-w-prose">
            {localized(series.description, series.descriptionEn)}
          </p>
        )}
        <p className="text-sm text-text-tertiary mt-2">{posts.length} {t("series.postsCount")}</p>
      </header>
      <div className="space-y-4">
        {posts.map((post, idx) => (
          <div key={post.id} className="flex items-start gap-4">
            <span className="text-lg font-bold text-text-tertiary mt-1 w-8 shrink-0 text-right">{idx + 1}</span>
            <div className="flex-1">
              <PostCard {...post} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
