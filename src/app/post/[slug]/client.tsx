"use client";

import { useEffect } from "react";
import { useI18n, useLocalized } from "@/i18n/provider";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CommentSection } from "@/components/blog/CommentSection";
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
}

export function PostDetailClient({ post, postTags, category, showViewCount }: PostDetailClientProps) {
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

        {/* Content */}
        <article className="animate-fade-in animate-delay-1">
          <MarkdownRenderer content={content} />
        </article>

        {/* Comments */}
        <div className="mt-20">
          <div className="h-px bg-border mb-12" />
          <CommentSection postId={post.id} slug={post.slug} />
        </div>
      </div>

      {/* TOC - absolute positioned to the right */}
      <TableOfContents />
    </div>
  );
}
