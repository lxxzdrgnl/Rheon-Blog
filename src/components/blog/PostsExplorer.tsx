"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FilterBar } from "./FilterBar";
import { PostGrid } from "./PostGrid";
import { useI18n, useLocalized } from "@/i18n/provider";

interface ExplorerPost {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  publishedAt: string | null;
  viewCount: number;
  categoryId: number;
  categoryName: string;
  categoryNameEn: string;
  tags?: { name: string; nameEn: string }[];
  thumbnailTextLength?: number | null;
  thumbnailTextLengthEn?: number | null;
  showTitleOnThumbnail?: boolean | null;
  snippet?: string | null;
}

interface Category { id: number; parentId?: number | null; name: string; nameEn: string; slug: string; }

type SortKey = "latest" | "oldest" | "views" | "title";

/**
 * 포스트 탭 — 카테고리 필터 + 정렬을 클라이언트에서 인플레이스로 처리.
 * 페이지 전환 없이 아래 목록만 바뀌고, 위 포스트/시리즈 탭은 그대로 유지된다.
 */
export function PostsExplorer({
  posts,
  categories,
  counts,
  initialCategorySlug,
}: {
  posts: ExplorerPost[];
  categories: Category[];
  counts?: Record<number, number>;
  /** URL ?cat=slug 로 들어온 초기 선택 카테고리 */
  initialCategorySlug?: string;
}) {
  const { locale } = useI18n();
  const localized = useLocalized();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedId, setSelectedId] = useState<number | null>(
    () => (initialCategorySlug ? categories.find((c) => c.slug === initialCategorySlug)?.id ?? null : null),
  );
  const [sort, setSort] = useState<SortKey>("latest");
  const en = locale === "en";

  // 카테고리 선택 → 인플레이스 필터 + URL ?cat= 동기화(공유·뒤로가기 가능)
  const handleSelect = (cat: { id: number; slug: string } | null) => {
    setSelectedId(cat?.id ?? null);
    router.replace(cat ? `${pathname}?cat=${cat.slug}` : pathname, { scroll: false });
  };

  // 선택 카테고리 + 모든 하위 카테고리 id 집합
  const allowedIds = useMemo(() => {
    if (selectedId == null) return null;
    const out = new Set<number>([selectedId]);
    const stack = [selectedId];
    while (stack.length) {
      const p = stack.pop()!;
      for (const c of categories) if (c.parentId === p) { out.add(c.id); stack.push(c.id); }
    }
    return out;
  }, [selectedId, categories]);

  const visible = useMemo(() => {
    const filtered = allowedIds ? posts.filter((p) => allowedIds.has(p.categoryId)) : posts;
    const dateOf = (p: ExplorerPost) => p.publishedAt || p.createdAt;
    const sorted = [...filtered];
    switch (sort) {
      case "latest":
        sorted.sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
        break;
      case "oldest":
        sorted.sort((a, b) => dateOf(a).localeCompare(dateOf(b)));
        break;
      case "views":
        sorted.sort((a, b) => b.viewCount - a.viewCount || dateOf(b).localeCompare(dateOf(a)));
        break;
      case "title":
        sorted.sort((a, b) =>
          localized(a.title, a.titleEn).localeCompare(localized(b.title, b.titleEn), en ? "en" : "ko"),
        );
        break;
    }
    return sorted;
  }, [posts, allowedIds, sort, localized, en]);

  const sortLabels: Record<SortKey, string> = en
    ? { latest: "Newest", oldest: "Oldest", views: "Most viewed", title: "Title" }
    : { latest: "최신순", oldest: "오래된순", views: "조회수순", title: "제목순" };

  return (
    <div className="space-y-4 md:space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <FilterBar
          categories={categories}
          tags={[]}
          counts={counts}
          selectedId={selectedId}
          onSelect={handleSelect}
        />

        <div className="relative ml-auto shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label={en ? "Sort" : "정렬"}
            className="appearance-none cursor-pointer rounded-md bg-bg-elevated pl-3 pr-8 py-1.5 text-sm text-text-secondary hover:text-accent focus:outline-none focus:ring-1 focus:ring-border transition-colors"
          >
            {(Object.keys(sortLabels) as SortKey[]).map((k) => (
              <option key={k} value={k} className="text-text-primary bg-bg-primary">
                {sortLabels[k]}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 필터/정렬이 바뀌면 key가 바뀌어 리마운트 → 부드러운 페이드인 재생 */}
      <div key={`${selectedId ?? "all"}-${sort}`} className="animate-fade-in">
        {visible.length > 0 ? (
          <PostGrid posts={visible} />
        ) : (
          <p className="text-sm text-text-tertiary text-center py-16">
            {en ? "No posts in this category." : "이 카테고리에 글이 없습니다."}
          </p>
        )}
      </div>
    </div>
  );
}
