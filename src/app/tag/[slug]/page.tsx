import { notFound } from "next/navigation";
import { PostGrid } from "@/components/blog/PostGrid";
import { getTags } from "@/actions/tags";
import { getCategories } from "@/actions/categories";
import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface Props { params: Promise<{ slug: string }>; }

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
    <div className="max-w-content mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold">#{tag.name}</h1>
      <PostGrid posts={postsWithCategory} />
    </div>
  );
}
