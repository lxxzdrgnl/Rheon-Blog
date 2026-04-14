import { HeroSection } from "@/components/blog/HeroSection";
import { PostGrid } from "@/components/blog/PostGrid";
import { FilterBar } from "@/components/blog/FilterBar";
import { PortfolioSection } from "@/components/blog/PortfolioSection";
import { getPosts, getAllPostTags } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";
import { getSettings } from "@/actions/settings";
import { getPortfolios } from "@/actions/portfolios";

export default async function Home() {
  const [allPosts, allCategories, allTags, settings, allPortfolios, postTagsMap] = await Promise.all([
    getPosts({ published: true }),
    getCategories(),
    getTags(),
    getSettings(),
    getPortfolios(),
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
    <div>
      <HeroSection
        title={(settings.hero_title as string) || "Welcome"}
        titleEn={(settings.hero_title_en as string) || "Welcome"}
        subtitle={(settings.hero_subtitle as string) || ""}
        subtitleEn={(settings.hero_subtitle_en as string) || ""}
        image={(settings.hero_image as string) || null}
      />

      <PortfolioSection portfolios={allPortfolios} />

      <section className="page-container pb-24 space-y-8">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight"><span className="text-accent mr-1.5">/</span>Posts</h2>
          <span className="text-sm text-text-tertiary">{postsWithCategory.length} articles</span>
        </div>
        <FilterBar categories={allCategories} tags={allTags} />
        <PostGrid posts={postsWithCategory} />
      </section>
    </div>
  );
}
