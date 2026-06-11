"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useLocalized } from "@/i18n/provider";
import { LocalizedThumbnail } from "./LocalizedThumbnail";

interface PostCardProps {
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  categoryName: string;
  categoryNameEn: string;
  tags?: { name: string; nameEn: string }[];
  thumbnailTextLength?: number | null;
  thumbnailTextLengthEn?: number | null;
  showTitleOnThumbnail?: boolean | null;
}

export function PostCard({ title, titleEn, slug, thumbnail, createdAt, categoryName, categoryNameEn, tags, thumbnailTextLength, thumbnailTextLengthEn, showTitleOnThumbnail }: PostCardProps) {
  const localized = useLocalized();
  const displayTitle = localized(title, titleEn);
  const displayCategory = localized(categoryName, categoryNameEn);

  return (
    <Link href={`/post/${slug}`} className="group block">
      <article>
        {/* ── Visual ── */}
        <LocalizedThumbnail title={title} titleEn={titleEn} thumbnail={thumbnail} textLength={thumbnailTextLength} textLengthEn={thumbnailTextLengthEn} showTitle={showTitleOnThumbnail} />

        {/* ── Meta ── */}
        <div className="mt-3 px-0.5">
          <h3 className="font-semibold text-[15px] text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-200">
            {displayTitle}
          </h3>

          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-tertiary">
            {displayCategory && (
              <>
                <span className="text-text-secondary">{displayCategory}</span>
                <span className="text-border">·</span>
              </>
            )}
            <span>{new Date(createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}</span>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag.name} className="text-[11px] text-accent/70 font-medium">
                  #{localized(tag.name, tag.nameEn)}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-[11px] text-text-tertiary">+{tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
