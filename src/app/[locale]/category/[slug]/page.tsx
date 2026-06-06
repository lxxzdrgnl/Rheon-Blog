import { notFound } from "next/navigation";
import { PostGrid } from "@/components/blog/PostGrid";
import { FilterBar } from "@/components/blog/FilterBar";
import { getPosts } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";
import type { Metadata } from "next";
import { pageMetadata, collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

interface Props { params: Promise<{ locale: string; slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const isEn = loc === "en";
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  const title = isEn && category.nameEn ? category.nameEn : category.name;
  const description = isEn ? `Posts in ${title}` : `${title} 카테고리의 글`;
  const path = `/category/${slug}`;
  return pageMetadata({ title, description, path, locale: loc, type: "website" });
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  const isEn = locale === "en";
  const loc = isEn ? "en" : "ko";
  const [allCategories, allTags] = await Promise.all([getCategories(), getTags()]);
  const category = allCategories.find((c) => c.slug === slug);
  if (!category) notFound();

  const allPosts = await getPosts({ published: true, categoryId: category.id });
  const postsWithCategory = allPosts.map((post) => ({
    ...post,
    categoryName: category.name,
    categoryNameEn: category.nameEn,
  }));

  const catName = isEn && category.nameEn ? category.nameEn : category.name;
  const jsonLd = [
    collectionPageJsonLd({
      locale: loc,
      path: `/category/${slug}`,
      name: catName,
      description: isEn ? `Posts in ${catName}` : `${catName} 카테고리의 글`,
    }),
    breadcrumbJsonLd([{ name: isEn ? "Home" : "홈", path: "" }, { name: catName, path: `/category/${slug}` }], loc),
  ];

  return (
    <div className="page-container py-10 space-y-8">
      <JsonLd data={jsonLd} />
      <h1 className="text-2xl font-bold">{category.name}</h1>
      <FilterBar categories={allCategories} tags={allTags} />
      <PostGrid posts={postsWithCategory} />
    </div>
  );
}
