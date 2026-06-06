import { notFound } from "next/navigation";
import { PostGrid } from "@/components/blog/PostGrid";
import { getTags } from "@/actions/tags";
import { getCategories } from "@/actions/categories";
import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

interface Props { params: Promise<{ locale: string; slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const isEn = loc === "en";
  const allTags = await getTags();
  const tag = allTags.find((t) => t.nameEn.toLowerCase().replace(/\s+/g, "-") === slug);
  if (!tag) return {};
  const name = isEn && tag.nameEn ? tag.nameEn : tag.name;
  const title = `#${name}`;
  const description = isEn ? `Posts tagged ${name}` : `${name} 태그의 글`;
  const path = `/tag/${slug}`;
  return pageMetadata({ title, description, path, locale: loc, type: "website" });
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const allTags = await getTags();
  const tag = allTags.find((t) => t.nameEn.toLowerCase().replace(/\s+/g, "-") === slug);
  if (!tag) notFound();

  const taggedPosts = db
    .select({
      id: posts.id, title: posts.title, titleEn: posts.titleEn,
      slug: posts.slug, thumbnail: posts.thumbnail, createdAt: posts.createdAt,
      categoryId: posts.categoryId,
    })
    .from(postTags)
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(and(eq(postTags.tagId, tag.id), eq(posts.isPublished, true)))
    .all();

  const allCategories = await getCategories();
  const postsWithCategory = taggedPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return { ...post, categoryName: cat?.name || "", categoryNameEn: cat?.nameEn || "" };
  });

  return (
    <div className="page-container py-10 space-y-8">
      <h1 className="text-2xl font-bold">#{tag.name}</h1>
      <PostGrid posts={postsWithCategory} />
    </div>
  );
}
