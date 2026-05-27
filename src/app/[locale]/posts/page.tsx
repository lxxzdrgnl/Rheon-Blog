import { PostGrid } from "@/components/blog/PostGrid";
import { FilterBar } from "@/components/blog/FilterBar";
import { getPosts, getAllPostTags } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";
import type { Metadata } from "next";
import { alternates, socialMeta } from "@/lib/seo";

interface Props { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const title = loc === "en" ? "Posts" : "글 목록";
  const description = loc === "en" ? "All blog posts" : "전체 블로그 글 목록";
  return {
    title,
    description,
    alternates: alternates("/posts", loc),
    ...socialMeta({ title, description, path: "/posts", locale: loc, type: "website" }),
  };
}

export default async function PostsPage() {
  const [allPosts, allCategories, allTags, postTagsMap] = await Promise.all([
    getPosts({ published: true }),
    getCategories(),
    getTags(),
    getAllPostTags(),
  ]);

  const postsWithCategory = allPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags: postTagsMap[post.id] || [],
    };
  });

  return (
    <div className="page-container py-10 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
      <FilterBar categories={allCategories} tags={allTags} />
      <PostGrid posts={postsWithCategory} />
    </div>
  );
}
