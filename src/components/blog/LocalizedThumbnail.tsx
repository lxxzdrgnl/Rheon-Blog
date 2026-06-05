"use client";

import { useI18n, useLocalized } from "@/i18n/provider";
import { PostThumbnail } from "./PostThumbnail";

interface LocalizedThumbnailProps {
  title: string;
  titleEn: string | null;
  thumbnail: string | null;
  /** 폴백 커버 글자 수 (ko) */
  textLength?: number | null;
  /** 폴백 커버 글자 수 (en). 없으면 ko 값 사용 */
  textLengthEn?: number | null;
  className?: string;
}

/**
 * 로케일을 반영한 커버 썸네일.
 * 제목/글자 수를 현재 로케일(ko/en)에 맞게 골라 PostThumbnail에 넘긴다.
 * 글 카드·시리즈 카드·시리즈 상세에서 공통으로 사용 — 로케일별 글자수 선택 로직을 한 곳에 둔다.
 */
export function LocalizedThumbnail({ title, titleEn, thumbnail, textLength, textLengthEn, className }: LocalizedThumbnailProps) {
  const { locale } = useI18n();
  const localized = useLocalized();
  const coverLen = locale === "en" ? textLengthEn ?? textLength : textLength;
  return (
    <PostThumbnail thumbnail={thumbnail} title={localized(title, titleEn)} textLength={coverLen} className={className} />
  );
}
