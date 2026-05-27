import { notFound } from "next/navigation";
import { getPortfolioBySlug, getPortfolioPosts } from "@/actions/portfolios";
import { getCategories } from "@/actions/categories";
import { getAllPostTags } from "@/actions/posts";
import { Metadata } from "next";
import { alternates, socialMeta } from "@/lib/seo";
import { ProjectDetailClient } from "./client";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await getPortfolioBySlug(slug);
  if (!project) return {};
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const isEn = loc === "en";
  const title = isEn && project.titleEn ? project.titleEn : project.title;
  const description = (isEn && project.descriptionEn ? project.descriptionEn : project.description) || title;
  const path = `/projects/${slug}`;
  return {
    title,
    description,
    alternates: alternates(path, loc),
    ...socialMeta({
      title,
      description,
      path,
      locale: loc,
      type: "article",
      images: project.thumbnail ? [project.thumbnail] : undefined,
    }),
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getPortfolioBySlug(slug);
  if (!project) notFound();

  const [relatedPosts, allCategories, postTagsMap] = await Promise.all([
    getPortfolioPosts(project.id),
    getCategories(),
    getAllPostTags(),
  ]);

  const postsWithCategory = relatedPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      titleEn: post.titleEn || null,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags: postTagsMap[post.id] || [],
    };
  });

  return (
    <ProjectDetailClient
      project={project}
      relatedPosts={postsWithCategory}
    />
  );
}
