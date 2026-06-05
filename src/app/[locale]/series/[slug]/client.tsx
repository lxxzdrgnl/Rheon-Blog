"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { useI18n, useLocalized } from "@/i18n/provider";
import { PostThumbnail } from "@/components/blog/PostThumbnail";

interface SeriesPost {
  id: number;
  num: number;
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  publishedAt: string | null;
  excerpt: string;
  excerptEn: string;
}

interface SeriesDetailClientProps {
  series: { title: string; titleEn: string | null; description: string | null; descriptionEn: string | null };
  posts: SeriesPost[];
  order: "asc" | "desc";
}

export function SeriesDetailClient({ series, posts, order }: SeriesDetailClientProps) {
  const { t, locale } = useI18n();
  const localized = useLocalized();
  const pathname = usePathname();

  const next = order === "desc" ? "asc" : "desc";
  const toggleHref = next === "asc" ? pathname : `${pathname}?order=desc`;

  return (
    <div className="page-container py-10">
      <header className="mb-8">
        <span className="text-xs text-accent font-semibold uppercase tracking-wider border-b-2 border-accent pb-1">
          {t("series.title")}
        </span>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-5">
          {localized(series.title, series.titleEn)}
        </h1>
        {series.description && (
          <p className="text-text-secondary mt-4 max-w-prose">
            {localized(series.description, series.descriptionEn)}
          </p>
        )}
      </header>

      <div className="flex items-center justify-between border-t border-border pt-5">
        <span className="text-sm text-text-tertiary">
          {posts.length}
          {locale === "en" ? ` ${t("series.postsCount")}` : t("series.postsCount")}
        </span>
        <Link
          href={toggleHref}
          scroll={false}
          replace
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-text-secondary bg-bg-elevated border border-border rounded-lg hover:text-text-primary transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${order === "desc" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          {order === "desc" ? t("series.sortDesc") : t("series.sortAsc")}
        </Link>
      </div>

      <ol className="mt-2 divide-y divide-border">
        {posts.map((post) => (
          <li key={post.id}>
            <LocaleLink href={`/post/${post.slug}`} className="group flex gap-5 py-7">
              <div className="w-40 sm:w-52 shrink-0">
                <PostThumbnail thumbnail={post.thumbnail} title={localized(post.title, post.titleEn)} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold leading-snug text-text-primary group-hover:text-accent transition-colors">
                  <span className="text-text-tertiary font-semibold italic mr-1.5">{post.num}.</span>
                  {localized(post.title, post.titleEn)}
                </h2>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                  {localized(post.excerpt, post.excerptEn || post.excerpt)}
                </p>
                <p className="mt-4 text-xs text-text-tertiary">
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString(
                    locale === "en" ? "en-US" : "ko-KR",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </p>
              </div>
            </LocaleLink>
          </li>
        ))}
      </ol>
    </div>
  );
}
