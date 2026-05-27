import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSeriesBySlug, getSeriesPosts } from "@/actions/series";
import { getCategories } from "@/actions/categories";
import { getAllPostTags } from "@/actions/posts";
import { alternates, socialMeta } from "@/lib/seo";
import { SeriesDetailClient } from "./client";

interface Props { params: Promise<{ locale: string; slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) return {};
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const isEn = loc === "en";
  const title = isEn && s.titleEn ? s.titleEn : s.title;
  const description = (isEn && s.descriptionEn ? s.descriptionEn : s.description) || title;
  const path = `/series/${slug}`;
  return {
    title,
    description,
    alternates: alternates(path, loc),
    ...socialMeta({ title, description, path, locale: loc, type: "website" }),
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) notFound();

  const [seriesPosts, categories, postTagsMap] = await Promise.all([
    getSeriesPosts(s.id),
    getCategories(),
    getAllPostTags(),
  ]);

  const postsWithCategory = seriesPosts.map((post) => {
    const cat = categories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags: postTagsMap[post.id] || [],
    };
  });

  return <SeriesDetailClient series={s} posts={postsWithCategory} />;
}
