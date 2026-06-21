"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
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

/** 한 페이지에 보여줄 포스트 수 */
const PAGE_SIZE = 9;

/**
 * 포스트 탭 — 카테고리 필터 + 정렬 + 페이지네이션을 클라이언트에서 인플레이스로 처리.
 * 페이지 전환 없이 아래 목록만 바뀌고, 위 포스트/시리즈 탭은 그대로 유지된다.
 * 카테고리·정렬을 바꾸면 항상 1페이지로 리셋된다.
 */
const isSortKey = (s: string | null): s is SortKey =>
  s === "latest" || s === "oldest" || s === "views" || s === "title";

const parsePage = (s: string | null | undefined) => {
  const n = Number(s);
  return Number.isInteger(n) && n > 1 ? n : 1;
};

export function PostsExplorer({
  posts,
  categories,
  counts,
  initialCategorySlug,
  initialSort,
  initialPage,
}: {
  posts: ExplorerPost[];
  categories: Category[];
  counts?: Record<number, number>;
  /** URL ?cat=slug 로 들어온 초기 선택 카테고리 */
  initialCategorySlug?: string;
  /** URL ?sort= 로 들어온 초기 정렬 */
  initialSort?: string;
  /** URL ?page= 로 들어온 초기 페이지(1부터) */
  initialPage?: string;
}) {
  const { locale } = useI18n();
  const localized = useLocalized();
  const pathname = usePathname();
  const slugToId = (slug?: string | null) => (slug ? categories.find((c) => c.slug === slug)?.id ?? null : null);
  const idToSlug = (id: number | null) => (id == null ? undefined : categories.find((c) => c.id === id)?.slug);
  const [selectedId, setSelectedId] = useState<number | null>(() => slugToId(initialCategorySlug));
  const [sort, setSort] = useState<SortKey>(() => (isSortKey(initialSort ?? null) ? (initialSort as SortKey) : "latest"));
  const [page, setPage] = useState<number>(() => parsePage(initialPage));
  const en = locale === "en";

  // 카테고리·정렬·페이지를 URL(?cat=&sort=&page=)에 함께 기록 — 서버 재요청 없이 URL만 갱신(인플레이스 유지).
  const writeUrl = (catSlug: string | undefined, sortKey: SortKey, pageNum: number) => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams();
    if (catSlug) sp.set("cat", catSlug);
    if (sortKey !== "latest") sp.set("sort", sortKey);
    if (pageNum > 1) sp.set("page", String(pageNum));
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  };

  // 실제 URL에서 cat·sort·page를 읽어 동기화 (App Router 캐시가 pathname 기준이라 서버 prop이 stale할 수 있음).
  // 마운트 1회 + 뒤로/앞으로(popstate) → 필터·정렬·페이지 초기화 버그 방지.
  useEffect(() => {
    const sync = () => {
      const sp = new URLSearchParams(window.location.search);
      setSelectedId(slugToId(sp.get("cat")));
      setSort(isSortKey(sp.get("sort")) ? (sp.get("sort") as SortKey) : "latest");
      setPage(parsePage(sp.get("page")));
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (cat: { id: number; slug: string } | null) => {
    setSelectedId(cat?.id ?? null);
    setPage(1); // 카테고리 변경 → 항상 1페이지부터
    writeUrl(cat?.slug, sort, 1);
  };

  const handleSort = (s: SortKey) => {
    setSort(s);
    setPage(1); // 정렬 변경 → 항상 1페이지부터
    writeUrl(idToSlug(selectedId), s, 1);
  };

  const handlePage = (pageNum: number) => {
    setPage(pageNum);
    writeUrl(idToSlug(selectedId), sort, pageNum);
    // 페이지 전환 시 목록 상단으로 부드럽게 스크롤
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
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

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  // 필터 결과가 줄어 현재 page가 범위를 벗어나면 마지막 페이지로 클램프(직접 URL 조작 대비).
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [visible, currentPage],
  );

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
            onChange={(e) => handleSort(e.target.value as SortKey)}
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

      {/* 필터/정렬/페이지가 바뀌면 key가 바뀌어 리마운트 → 부드러운 페이드인 재생 */}
      <div key={`${selectedId ?? "all"}-${sort}-${currentPage}`} className="animate-fade-in">
        {paged.length > 0 ? (
          <PostGrid posts={paged} />
        ) : (
          <p className="text-sm text-text-tertiary text-center py-16">
            {en ? "No posts in this category." : "이 카테고리에 글이 없습니다."}
          </p>
        )}
      </div>

      {visible.length > 0 && (
        <Pagination current={currentPage} total={totalPages} onChange={handlePage} en={en} />
      )}
    </div>
  );
}

/** 현재 페이지 주변만 노출하는 페이지 번호 목록 (양 끝 + 현재±1, 사이는 생략 표시). */
function pageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("…");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}

function Pagination({
  current,
  total,
  onChange,
  en,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
  en: boolean;
}) {
  const arrowCls =
    "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm text-text-secondary transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-text-secondary";
  return (
    <nav
      aria-label={en ? "Pagination" : "페이지 이동"}
      className="flex items-center justify-center gap-1 pt-2"
    >
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        aria-label={en ? "Previous page" : "이전 페이지"}
        className={arrowCls}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pageItems(current, total).map((it, i) =>
        it === "…" ? (
          <span key={`gap-${i}`} className="flex h-8 min-w-8 items-center justify-center text-sm text-text-tertiary">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            aria-current={it === current ? "page" : undefined}
            className={
              it === current
                ? "flex h-8 min-w-8 items-center justify-center rounded-md bg-accent px-2 text-sm font-semibold text-white"
                : "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-accent"
            }
          >
            {it}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current >= total}
        aria-label={en ? "Next page" : "다음 페이지"}
        className={arrowCls}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
