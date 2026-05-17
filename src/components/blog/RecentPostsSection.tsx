"use client";

import { useI18n } from "@/i18n/provider";
import { PostCard } from "./PostCard";
import Link from "next/link";

interface Post {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  categoryName: string;
  categoryNameEn: string;
  tags?: { name: string; nameEn: string }[];
}

export function RecentPostsSection({ posts }: { posts: Post[] }) {
  const { t } = useI18n();

  if (posts.length === 0) return null;

  return (
    <section className="page-container pb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-text-tertiary">
          <div className="h-px w-8 bg-border" />
          {t("resume.recentPosts")}
        </h2>
        <Link href="/posts" className="text-xs text-text-tertiary hover:text-accent transition-colors tracking-wide uppercase">
          {t("hero.allPosts")} &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.slice(0, 6).map((post) => (
          <PostCard key={post.id} {...post} />
        ))}
      </div>
    </section>
  );
}
