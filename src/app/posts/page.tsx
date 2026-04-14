import { PostGrid } from "@/components/blog/PostGrid";
import { FilterBar } from "@/components/blog/FilterBar";
import { getPosts, getAllPostTags } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";

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
    <div className="page-container py-16 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
      <FilterBar categories={allCategories} tags={allTags} />
      <PostGrid posts={postsWithCategory} />
    </div>
  );
}
