import { PostGrid } from "@/components/blog/PostGrid";
import { searchPosts } from "@/actions/search";
import { getCategories } from "@/actions/categories";
import { SearchBar } from "@/components/ui/SearchBar";

interface Props { searchParams: Promise<{ q?: string }>; }

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const allCategories = await getCategories();

  const results = q ? await searchPosts(q) : [];
  const postsWithCategory = results.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return { ...post, categoryName: cat?.name || "", categoryNameEn: cat?.nameEn || "" };
  });

  return (
    <div className="max-w-content mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold">검색</h1>
      <div className="max-w-md">
        <SearchBar />
      </div>
      {q && (
        <p className="text-sm text-text-secondary">
          &quot;{q}&quot; 검색 결과 {results.length}건
        </p>
      )}
      <PostGrid posts={postsWithCategory} />
    </div>
  );
}
