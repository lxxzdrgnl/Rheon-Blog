"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useI18n, useLocalized } from "@/i18n/provider";

interface OtherPost {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  createdAt: string;
  /** 없으면 댓글 수를 표시하지 않는다 (프로젝트 관련 포스트처럼 집계가 없는 목록). */
  commentCount?: number;
}

const fmtDate = (s: string) => {
  const d = new Date(s);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

/**
 * 제목+날짜 한 줄짜리 글 목록 카드.
 * 기본은 포스트 상세 댓글 위 "'{카테고리}' 카테고리의 다른 글"(없으면 최신글)이지만,
 * heading을 넘기면 임의의 목록(프로젝트의 관련 포스트 등)에도 그대로 쓴다.
 */
export function CategoryOtherPosts({
  categoryName,
  categoryNameEn,
  categorySlug,
  posts,
  latest = false,
  heading,
  showMore = true,
}: {
  categoryName?: string | null;
  categoryNameEn?: string | null;
  categorySlug?: string | null;
  posts: OtherPost[];
  /** 카테고리에 다른 글이 없어 최신글로 폴백한 경우 */
  latest?: boolean;
  /** 카테고리 문구 대신 쓸 제목. */
  heading?: string;
  /** 목록이 그 자체로 완결이면(전체 보기 대상이 없으면) false. */
  showMore?: boolean;
}) {
  const { locale } = useI18n();
  const localized = useLocalized();
  if (posts.length === 0) return null;
  const catName = localized(categoryName || "", categoryNameEn || "");
  const moreHref = latest || !categorySlug ? "/posts" : `/posts?cat=${categorySlug}`;

  return (
    <div className="rounded-xl border border-border bg-bg-primary px-5 py-4">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h3 className="text-sm font-bold">
          {heading ? (
            heading
          ) : latest || !catName ? (
            locale === "en" ? "Latest posts" : "최신 글"
          ) : (
            <>
              <span className="text-accent">&lsquo;{catName}&rsquo;</span>{" "}
              {locale === "en" ? "category — other posts" : "카테고리의 다른 글"}
            </>
          )}
        </h3>
        {showMore && (
          <Link href={moreHref} className="text-xs text-text-tertiary hover:text-accent transition-colors shrink-0">
            {locale === "en" ? "More" : "더보기"}
          </Link>
        )}
      </div>
      <ul className="divide-y divide-border/50">
        {posts.map((p) => (
          <li key={p.id} className="py-2.5 flex items-center justify-between gap-3">
            <Link
              href={`/post/${p.slug}`}
              className="text-sm text-text-secondary hover:text-accent transition-colors truncate min-w-0"
            >
              {localized(p.title, p.titleEn)}
              {!!p.commentCount && p.commentCount > 0 && (
                <span className="text-text-tertiary ml-1.5">({p.commentCount})</span>
              )}
            </Link>
            <span className="text-xs text-text-tertiary tabular-nums shrink-0">{fmtDate(p.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
