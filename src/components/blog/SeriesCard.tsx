"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useI18n, useLocalized } from "@/i18n/provider";
import { LocalizedThumbnail } from "./LocalizedThumbnail";
import { Highlight } from "@/components/ui/Highlight";

interface SeriesCardProps {
  title: string;
  titleEn: string | null;
  slug: string;
  description?: string | null;
  descriptionEn?: string | null;
  thumbnail: string | null;
  postCount: number;
  lastUpdated: string;
  thumbnailTextLength: number | null;
  thumbnailTextLengthEn: number | null;
  showTitleOnThumbnail?: boolean | null;
  /** 검색 결과에서 일치 구간 강조 */
  highlight?: string;
}

export function SeriesCard({ title, titleEn, slug, description, descriptionEn, thumbnail, postCount, lastUpdated, thumbnailTextLength, thumbnailTextLengthEn, showTitleOnThumbnail, highlight }: SeriesCardProps) {
  const { t, locale } = useI18n();
  const localized = useLocalized();
  const displayTitle = localized(title, titleEn);
  const displayDescription = localized(description || "", descriptionEn || "");
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
          showTitle={showTitleOnThumbnail}
        />

        <div className="mt-3 px-0.5">
          <h3 className="font-semibold text-[15px] text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-200">
            <Highlight text={displayTitle} query={highlight} />
          </h3>
          {displayDescription && (
            <p className="mt-1.5 text-[13px] text-text-secondary leading-relaxed line-clamp-2">
              <Highlight text={displayDescription} query={highlight} />
            </p>
          )}
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
