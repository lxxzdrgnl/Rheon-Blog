import { HeroSection } from "@/components/blog/HeroSection";
import { PostGrid } from "@/components/blog/PostGrid";
import { FilterBar } from "@/components/blog/FilterBar";
import { getPosts } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";
import { getSettings } from "@/actions/settings";

export default async function Home() {
  const [allPosts, allCategories, allTags, settings] = await Promise.all([
    getPosts({ published: true }),
    getCategories(),
    getTags(),
    getSettings(),
  ]);

  const postsWithCategory = allPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
    };
  });

  return (
    <div>
      <HeroSection
        title={(settings.hero_title as string) || "Welcome"}
        titleEn={(settings.hero_title_en as string) || "Welcome"}
        subtitle={(settings.hero_subtitle as string) || ""}
        subtitleEn={(settings.hero_subtitle_en as string) || ""}
      />
      <section className="max-w-content mx-auto px-6 pb-20 space-y-8">
        <FilterBar categories={allCategories} tags={allTags} />
        <PostGrid posts={postsWithCategory} />
      </section>
    </div>
  );
}
