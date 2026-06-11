"use client";

import { useEffect } from "react";
import { useI18n, useLocalized } from "@/i18n/provider";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CommentSection } from "@/components/blog/CommentSection";
import { SeriesTableOfContents } from "@/components/blog/SeriesTableOfContents";
import { SeriesNavigation } from "@/components/blog/SeriesNavigation";
import { CategorySidebar } from "@/components/blog/CategorySidebar";
import { CategoryOtherPosts } from "@/components/blog/CategoryOtherPosts";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";

interface CatNode { id: number; parentId: number | null; name: string; nameEn: string; slug: string; postCount?: number; children: CatNode[] }
interface OtherPost { id: number; title: string; titleEn: string | null; slug: string; createdAt: string; commentCount: number }
interface RecentPost { id: number; title: string; titleEn: string | null; slug: string; createdAt: string }

// 이 세션에서 이미 조회 집계를 보낸 글 — strict mode 이중 발화/중복 호출 방지
const viewSent = new Set<string>();

interface PostDetailClientProps {
  post: {
    id: number; title: string; titleEn: string | null; slug: string;
    content: string; contentEn: string | null; createdAt: string;
    viewCount: number; categoryId: number;
  };
  postTags: { id: number; name: string; nameEn: string }[];
  category: { name: string; nameEn: string; slug: string } | null;
  showViewCount: boolean;
  seriesData: {
    title: string;
    titleEn: string | null;
    posts: { id: number; title: string; titleEn: string | null; slug: string }[];
    prevPost: { id: number; title: string; titleEn: string | null; slug: string } | null;
    nextPost: { id: number; title: string; titleEn: string | null; slug: string } | null;
  } | null;
  projects: {
    id: number; title: string; titleEn: string | null; slug: string;
    description: string; descriptionEn: string | null; techStack: string; thumbnail: string | null;
  }[];
  categoryTree: CatNode[];
  categoryCounts: Record<number, number>;
  recentPosts: RecentPost[];
  viewStats: { total: number; today: number };
  otherPosts: OtherPost[];
  otherIsLatest: boolean;
}

export function PostDetailClient({ post, postTags, category, showViewCount, seriesData, projects, categoryTree, categoryCounts, recentPosts, viewStats, otherPosts, otherIsLatest }: PostDetailClientProps) {
  const { locale, t } = useI18n();
  const localized = useLocalized();

  useEffect(() => {
    // 모듈 레벨 가드 — strict mode 이중 발화/경합으로 조회수가 두 번 오르는 것 방지
    if (viewSent.has(post.slug)) return;
    viewSent.add(post.slug);
    fetch(`/api/view/${post.slug}`, { method: "POST" }).catch(() => {});
  }, [post.slug]);

  const title = localized(post.title, post.titleEn);
  const content = localized(post.content, post.contentEn);
  const catName = category ? localized(category.name, category.nameEn) : null;

  return (
    <div className="page-container py-6 md:py-10 relative">
      <div className="max-w-prose mx-auto px-1 sm:px-0">
        {/* Header */}
        <header className="mb-6 animate-fade-in">
          <h1 className="text-2xl md:text-4xl font-bold leading-[1.15] tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-3 mt-4 text-sm text-text-secondary">
            {category && (
              <Link href={`/posts?cat=${category.slug}`} className="hover:text-accent transition-colors">
                {catName}
              </Link>
            )}
            {category && <span className="w-px h-3 bg-border" />}
            <span>
              {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
            {showViewCount && (
              <>
                <span className="w-px h-3 bg-border" />
                <span>{t("post.viewCount")} {post.viewCount.toLocaleString()}</span>
              </>
            )}
          </div>
          {postTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {postTags.map((tag) => {
                const name = localized(tag.name, tag.nameEn);
                return (
                  <Link
                    key={tag.id}
                    href={`/search?q=${encodeURIComponent(name)}`}
                    className="text-[13px] font-medium text-accent/80 hover:text-accent transition-colors"
                  >
                    #{name}
                  </Link>
                );
              })}
            </div>
          )}
          <div className="mt-5 h-px bg-border" />
        </header>

        {/* Related Project(s) */}
        {seriesData && (
          <SeriesTableOfContents
            seriesTitle={seriesData.title}
            seriesTitleEn={seriesData.titleEn}
            posts={seriesData.posts}
            currentPostId={post.id}
          />
        )}

        {/* Related Project(s) — 시리즈 아래 */}
        {projects.length > 0 && (
          <div className="mt-5 mb-6 space-y-2 animate-fade-in" style={{ fontFamily: "var(--font-family-sans)" }}>
            {projects.map((p) => {
              const pTitle = localized(p.title, p.titleEn);
              const pDesc = localized(p.description, p.descriptionEn);
              let techs: string[] = [];
              try { techs = JSON.parse(p.techStack || "[]"); } catch { techs = []; }
              const titleSize = pTitle.length > 24 ? "text-base" : pTitle.length > 14 ? "text-lg" : "text-xl";
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border bg-bg-primary p-3 hover:border-accent/40 transition-colors duration-200"
                >
                  <div className="w-full sm:w-56 shrink-0 aspect-[16/10] rounded-xl border border-text-tertiary/30 overflow-hidden bg-bg-elevated flex items-center justify-center">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={pTitle} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-text-tertiary/30 select-none">{pTitle.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-accent mb-1">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      <span className="text-[13px] font-bold uppercase tracking-wide">
                        {locale === "en" ? "Project" : "관련 프로젝트"}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <h3 className={`${titleSize} font-semibold text-text-primary group-hover:text-accent transition-colors duration-250 break-keep`}>
                        {pTitle}
                      </h3>
                      <svg className="w-3 h-3 shrink-0 text-accent opacity-0 group-hover:opacity-100 transition-all duration-250" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </div>
                    {pDesc && <p className="text-sm text-text-secondary mt-1 line-clamp-3 leading-relaxed">{pDesc}</p>}
                    {techs.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
                        {techs.slice(0, 8).map((t) => (
                          <span key={t} className="text-[11px] text-accent/80 font-medium">{t}</span>
                        ))}
                        {techs.length > 8 && <span className="text-[11px] text-text-tertiary">+{techs.length - 8}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Content */}
        <article className="animate-fade-in animate-delay-1">
          <MarkdownRenderer content={content} />
        </article>

        {/* 글 끝 — 구분선 */}
        <div className="h-px bg-border my-8" />

        {seriesData && <SeriesNavigation prevPost={seriesData.prevPost} nextPost={seriesData.nextPost} />}

        {/* 이 카테고리의 다른 글 (없으면 최신글) */}
        {otherPosts.length > 0 && (
          <div className="mt-8">
            <CategoryOtherPosts
              categoryName={category?.name}
              categoryNameEn={category?.nameEn}
              categorySlug={category?.slug}
              posts={otherPosts}
              latest={otherIsLatest}
            />
          </div>
        )}

        {/* Comments */}
        <div className="mt-8">
          <CommentSection postId={post.id} slug={post.slug} />
        </div>
      </div>

      {/* 왼쪽 분류 트리 · 오른쪽 TOC (xl 이상) */}
      <CategorySidebar tree={categoryTree} counts={categoryCounts} recentPosts={recentPosts} viewStats={viewStats} activeSlug={category?.slug} />
      <TableOfContents />
    </div>
  );
}
