"use client";

import { useI18n } from "@/i18n/provider";
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
  const title = locale === "en" && post.titleEn ? post.titleEn : post.title;
  const content = locale === "en" && post.contentEn ? post.contentEn : post.content;
  const catName = locale === "en" ? category?.nameEn : category?.name;

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <header className="max-w-prose mx-auto mb-10">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
        <div className="flex items-center gap-3 mt-4 text-sm text-text-secondary">
          {category && (
            <Link href={`/category/${category.slug}`} className="px-3 py-1 bg-bg-card rounded-full hover:text-text-primary">{catName}</Link>
          )}
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          {showViewCount && <span>{t("post.viewCount")} {post.viewCount}</span>}
        </div>
        {postTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {postTags.map((tag) => (
              <span key={tag.id} className="text-xs text-accent">#{locale === "en" ? tag.nameEn : tag.name}</span>
            ))}
          </div>
        )}
      </header>
      <div className="flex justify-center">
        <article className="max-w-prose w-full">
          <MarkdownRenderer content={content} />
        </article>
        <TableOfContents />
      </div>
      <div className="max-w-prose mx-auto mt-16">
        <CommentSection postId={post.id} slug={post.slug} />
      </div>
    </div>
  );
}
