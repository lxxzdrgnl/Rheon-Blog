import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSeriesBySlug, getSeriesPosts } from "@/actions/series";
import { getCategories } from "@/actions/categories";
import { getAllPostTags } from "@/actions/posts";
import { SeriesDetailClient } from "./client";

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) return {};
  return { title: s.title, description: s.description || s.title };
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
