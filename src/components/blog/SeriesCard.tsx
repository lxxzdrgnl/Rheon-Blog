"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useI18n, useLocalized } from "@/i18n/provider";
import { LocalizedThumbnail } from "./LocalizedThumbnail";

interface SeriesCardProps {
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  postCount: number;
  lastUpdated: string;
  thumbnailTextLength: number | null;
  thumbnailTextLengthEn: number | null;
}

export function SeriesCard({ title, titleEn, slug, thumbnail, postCount, lastUpdated, thumbnailTextLength, thumbnailTextLengthEn }: SeriesCardProps) {
  const { t, locale } = useI18n();
  const localized = useLocalized();
  const displayTitle = localized(title, titleEn);
  const countLabel = localized(
    `${postCount}${t("series.postsCount")}`,
    `${postCount} ${postCount === 1 ? "post" : "posts"}`,
  );
  const dateStr = new Date(lastUpdated).toLocaleDateString(locale === "en" ? "en-US" : "ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/series/${slug}`} className="group block">
      <article>
        <LocalizedThumbnail
          title={title}
          titleEn={titleEn}
          thumbnail={thumbnail}
          textLength={thumbnailTextLength}
          textLengthEn={thumbnailTextLengthEn}
        />

        <div className="mt-3 px-0.5">
          <h3 className="font-semibold text-[15px] text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-200">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-tertiary">
            <span className="text-text-secondary">{countLabel}</span>
            <span className="text-border">·</span>
            <span>
              {t("series.lastUpdated")} {dateStr}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
