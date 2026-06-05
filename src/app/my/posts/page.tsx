"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getPosts, deletePost } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getPortfolios, getProjectsForPost } from "@/actions/portfolios";
import { Button } from "@/components/ui/Button";
import { PublishSettingsModal } from "@/components/admin/PublishSettingsModal";
import { SeriesManager } from "@/components/admin/SeriesManager";
import { CategoryManager } from "@/components/admin/CategoryManager";

type ContentTab = "posts" | "series" | "category";

interface Post {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  isPublished: boolean;
  isPrivate: boolean;
  viewCount: number;
  createdAt: string;
  categoryId: number;
  thumbnail: string | null;
  thumbnailTextLength: number | null;
  thumbnailTextLengthEn: number | null;
}

interface Category {
  id: number;
  parentId?: number | null;
  name: string;
  nameEn: string;
  slug: string;
}

export default function MyPostsPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "private" | "draft">("all");
  const [allProjects, setAllProjects] = useState<{ id: number; title: string }[]>([]);
  const [publishPost, setPublishPost] = useState<Post | null>(null);
  const [publishProjectIds, setPublishProjectIds] = useState<number[]>([]);
  const [tab, setTab] = useState<ContentTab>(() => {
    if (typeof window === "undefined") return "posts";
    const t = new URLSearchParams(window.location.search).get("tab");
    return t === "series" || t === "category" ? t : "posts";
  });

  const selectTab = (t: ContentTab) => {
    setTab(t);
    if (typeof window !== "undefined") {
      const url = t === "posts" ? "/my/posts" : `/my/posts?tab=${t}`;
      window.history.replaceState(null, "", url);
    }
  };

  const loadAll = () => {
    getPosts().then((p) => setAllPosts(p as Post[]));
    getCategories().then(setCategories);
    getPortfolios().then((p) => setAllProjects(p as { id: number; title: string }[]));
  };

  const openPublish = async (post: Post) => {
    const projs = await getProjectsForPost(post.id);
    setPublishProjectIds(projs.map((p) => p.id));
    setPublishPost(post);
  };

  useEffect(() => { loadAll(); }, []);

  const topCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);

  const filtered = useMemo(() => {
    let result = allPosts;

    // 검색
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    // 카테고리 필터 (하위 카테고리 포함)
    if (filterCategoryId) {
      const childIds = categories.filter((c) => c.parentId === filterCategoryId).map((c) => c.id);
      const grandChildIds = categories.filter((c) => childIds.includes(c.parentId ?? 0)).map((c) => c.id);
      const allIds = [filterCategoryId, ...childIds, ...grandChildIds];
      result = result.filter((p) => allIds.includes(p.categoryId));
    }

    // 상태 필터
    if (filterStatus === "published") result = result.filter((p) => p.isPublished && !p.isPrivate);
    else if (filterStatus === "private") result = result.filter((p) => p.isPublished && p.isPrivate);
    else if (filterStatus === "draft") result = result.filter((p) => !p.isPublished);

    return result;
  }, [allPosts, search, filterCategoryId, filterStatus, categories]);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    await deletePost(id);
    loadAll();
  };

  const getCategoryName = (categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">콘텐츠</h1>
        {tab === "posts" && (
          <Link href="/my/write">
            <Button>새 글 작성</Button>
          </Link>
        )}
      </div>

      {/* 내부 탭: 글 / 시리즈 / 카테고리 */}
      <div className="flex gap-1 border-b border-border">
        {([
          ["posts", "글"],
          ["series", "시리즈"],
          ["category", "카테고리"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => selectTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? "border-accent text-text-primary" : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "posts" && (
      <>
      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="글 제목 검색..."
            className="w-full px-3 py-2 pl-9 rounded-lg border border-border bg-bg-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category + Status filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterCategoryId(null)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${!filterCategoryId ? "bg-accent text-white font-medium" : "text-text-secondary hover:bg-bg-elevated"}`}
            >
              전체
            </button>
            {topCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? null : cat.id)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${filterCategoryId === cat.id ? "bg-accent text-white font-medium" : "text-text-secondary hover:bg-bg-elevated"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {(["all", "published", "private", "draft"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${filterStatus === s ? "bg-bg-elevated text-text-primary font-medium" : "text-text-tertiary hover:text-text-secondary"}`}
              >
                {{ all: "전체", published: "발행", private: "비공개", draft: "임시" }[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-text-tertiary">{filtered.length}개의 글</p>

      {/* Post list */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          {filtered.map((post) => (
            <div key={post.id} className="flex items-center gap-4 px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-bg-card/50 transition-colors">
              <div className="flex-1 min-w-0">
                <Link href={`/my/write?id=${post.id}`} className="text-sm font-medium hover:underline underline-offset-2 block truncate">
                  {post.title}
                </Link>
                <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                  <span>{getCategoryName(post.categoryId)}</span>
                  <span className="w-px h-3 bg-border" />
                  <span>{new Date(post.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</span>
                  <span className="w-px h-3 bg-border" />
                  <span>조회 {post.viewCount}</span>
                </div>
              </div>

              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                post.isPublished
                  ? post.isPrivate
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-bg-elevated text-text-tertiary"
              }`}>
                {post.isPublished ? (post.isPrivate ? "비공개" : "발행") : "임시"}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                {post.isPublished && !post.isPrivate && (
                  <Link href={`/post/${post.slug}`} className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors" title="보기">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                )}
                <button onClick={() => openPublish(post)} className="p-1.5 text-text-tertiary hover:text-accent transition-colors" title="출간 설정">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.397-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <Link href={`/my/write?id=${post.id}`} className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors" title="수정">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </Link>
                <button onClick={() => handleDelete(post.id)} className="p-1.5 text-text-tertiary hover:text-red-500 transition-colors" title="삭제">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-text-tertiary">
          {search || filterCategoryId || filterStatus !== "all" ? "검색 결과가 없습니다" : "아직 작성된 글이 없습니다"}
        </div>
      )}
      </>
      )}

      {tab === "series" && <SeriesManager />}
      {tab === "category" && <CategoryManager />}

      {publishPost && (
        <PublishSettingsModal
          post={publishPost}
          projects={allProjects}
          initialProjectIds={publishProjectIds}
          onClose={() => setPublishPost(null)}
          onSaved={loadAll}
        />
      )}
    </div>
  );
}
