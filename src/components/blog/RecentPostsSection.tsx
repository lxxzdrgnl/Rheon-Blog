"use client";

import { useI18n } from "@/i18n/provider";
import { PostCard } from "./PostCard";
import Link from "next/link";
import { SectionHeading } from "./ExperienceSection";

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
    <section className="page-container py-8 pb-16">
      <div className="h-px bg-border mb-8" />
      <div className="flex items-baseline justify-between mb-6">
        <SectionHeading>{t("resume.recentPosts")}</SectionHeading>
        <Link href="/posts" className="text-[11px] font-medium text-text-tertiary hover:text-accent transition-colors tracking-wide uppercase">
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
