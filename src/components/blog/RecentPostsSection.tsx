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
    <section className="page-container pb-12">
      <div className="flex items-end justify-between mb-5">
        <h2 className="text-lg font-bold tracking-tight">
          <span className="text-accent mr-1.5">/</span>{t("resume.recentPosts")}
        </h2>
        <Link href="/posts" className="text-sm text-text-tertiary hover:text-accent transition-colors">
          {t("hero.allPosts")} →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, 6).map((post) => (
          <PostCard key={post.id} {...post} />
        ))}
      </div>
    </section>
  );
}
