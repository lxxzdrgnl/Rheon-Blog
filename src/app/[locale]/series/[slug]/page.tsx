import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSeriesBySlug, getSeriesPosts } from "@/actions/series";
import { getCategories } from "@/actions/categories";
import { getAllPostTags } from "@/actions/posts";
import { excerptFromMarkdown } from "@/lib/markdown";
import { alternates, socialMeta, collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { SeriesDetailClient } from "./client";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ order?: string }>;
}

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

export default async function SeriesPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const isEn = locale === "en";
  const loc = isEn ? "en" : "ko";
  const { order } = await searchParams;
  const desc = order === "desc";
  const s = await getSeriesBySlug(slug);
  if (!s) notFound();

  const [seriesPosts, categories, postTagsMap] = await Promise.all([
    getSeriesPosts(s.id),
    getCategories(),
    getAllPostTags(),
  ]);

  // 챕터 번호는 오름차순 기준으로 고정 — 내림차순으로 봐도 번호는 그대로 유지.
  const numbered = seriesPosts.map((post, i) => ({ post, num: i + 1 }));
  const ordered = desc ? [...numbered].reverse() : numbered;

  const postsWithCategory = ordered.map(({ post, num }) => {
    const cat = categories.find((c) => c.id === post.categoryId);
    return {
      id: post.id,
      num,
      title: post.title,
      titleEn: post.titleEn,
      slug: post.slug,
      thumbnail: post.thumbnail,
      thumbnailTextLength: post.thumbnailTextLength,
      thumbnailTextLengthEn: post.thumbnailTextLengthEn,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      excerpt: excerptFromMarkdown(post.content),
      excerptEn: excerptFromMarkdown(post.contentEn),
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags: postTagsMap[post.id] || [],
    };
  });

  const seriesName = isEn && s.titleEn ? s.titleEn : s.title;
  const jsonLd = [
    collectionPageJsonLd({
      locale: loc,
      path: `/series/${slug}`,
      name: seriesName,
      description: (isEn && s.descriptionEn ? s.descriptionEn : s.description) || "",
    }),
    breadcrumbJsonLd([{ name: isEn ? "Home" : "홈", path: "" }, { name: seriesName, path: `/series/${slug}` }], loc),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <SeriesDetailClient series={s} posts={postsWithCategory} order={desc ? "desc" : "asc"} />
    </>
  );
}
