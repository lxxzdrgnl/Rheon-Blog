import { notFound } from "next/navigation";
import { PostGrid } from "@/components/blog/PostGrid";
import { FilterBar } from "@/components/blog/FilterBar";
import { getPosts } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";
import { getSetting } from "@/actions/settings";

interface Props { params: Promise<{ slug: string }>; }

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [allCategories, allTags, thumbLen] = await Promise.all([getCategories(), getTags(), getSetting("thumbnail_text_length")]);
  const category = allCategories.find((c) => c.slug === slug);
  if (!category) notFound();

  const allPosts = await getPosts({ published: true, categoryId: category.id });
  const postsWithCategory = allPosts.map((post) => ({
    ...post,
    categoryName: category.name,
    categoryNameEn: category.nameEn,
  }));

  return (
    <div className="page-container py-10 space-y-8">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      <FilterBar categories={allCategories} tags={allTags} />
      <PostGrid posts={postsWithCategory} thumbnailTextLength={Number(thumbLen) || 8} />
    </div>
  );
}
