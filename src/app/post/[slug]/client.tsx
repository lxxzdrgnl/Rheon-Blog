"use client";

import { useEffect } from "react";
import { useI18n, useLocalized } from "@/i18n/provider";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PostThumbnail } from "@/components/blog/PostThumbnail";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CommentSection } from "@/components/blog/CommentSection";
import { SeriesTableOfContents } from "@/components/blog/SeriesTableOfContents";
import { SeriesNavigation } from "@/components/blog/SeriesNavigation";
import Link from "next/link";

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
    description: string; descriptionEn: string | null; techStack: string;
  }[];
}

export function PostDetailClient({ post, postTags, category, showViewCount, seriesData, projects }: PostDetailClientProps) {
  const { locale, t } = useI18n();
  const localized = useLocalized();

  useEffect(() => {
    fetch(`/api/view/${post.slug}`, { method: "POST" }).catch(() => {});
  }, [post.slug]);

  const title = localized(post.title, post.titleEn);
  const content = localized(post.content, post.contentEn);
  const catName = category ? localized(category.name, category.nameEn) : null;

  return (
    <div className="page-container py-16 relative">
      <div className="max-w-prose mx-auto">
        {/* Header */}
        <header className="mb-12 animate-fade-in">
          <h1 className="text-2xl md:text-4xl font-bold leading-[1.15] tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-3 mt-6 text-sm text-text-secondary">
            {category && (
              <Link href={`/category/${category.slug}`} className="hover:text-text-primary transition-colors">
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
            <div className="flex flex-wrap gap-2 mt-4">
              {postTags.map((tag) => (
                <span key={tag.id} className="text-xs text-text-tertiary">
                  #{localized(tag.name, tag.nameEn)}
                </span>
              ))}
            </div>
          )}
          <div className="mt-8 h-px bg-border" />
        </header>

        {/* Related Project(s) */}
        {projects.length > 0 && (
          <div className="mb-6 space-y-2 animate-fade-in" style={{ fontFamily: "var(--font-family-sans)" }}>
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
                  className="group flex items-center gap-4 rounded-xl border border-border/60 bg-bg-card p-2.5 hover:border-accent/50 hover:bg-accent-soft/30 transition-all duration-250"
                >
                  <div className="w-24 sm:w-28 shrink-0">
                    <PostThumbnail thumbnail={null} title={pTitle} textLength={10} coverFont="sans" wrap={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-accent mb-0.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      <span className="text-[10px] font-bold uppercase tracking-widest">
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
                    {pDesc && <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{pDesc}</p>}
                    {techs.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                        {techs.slice(0, 5).map((t) => (
                          <span key={t} className="text-[11px] text-accent/80 font-medium">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {seriesData && (
          <SeriesTableOfContents
            seriesTitle={seriesData.title}
            seriesTitleEn={seriesData.titleEn}
            posts={seriesData.posts}
            currentPostId={post.id}
          />
        )}

        {/* Content */}
        <article className="animate-fade-in animate-delay-1">
          <MarkdownRenderer content={content} />
        </article>

        {/* Comments */}
        <div className="mt-20">
          <div className="h-px bg-border mb-12" />
          {seriesData && (
            <SeriesNavigation
              prevPost={seriesData.prevPost}
              nextPost={seriesData.nextPost}
            />
          )}
          <CommentSection postId={post.id} slug={post.slug} />
        </div>
      </div>

      {/* TOC - absolute positioned to the right */}
      <TableOfContents />
    </div>
  );
}
