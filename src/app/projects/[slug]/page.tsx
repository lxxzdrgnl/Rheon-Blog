import { notFound } from "next/navigation";
import { getPortfolioBySlug, getPortfolioPosts } from "@/actions/portfolios";
import { getCategories } from "@/actions/categories";
import { Metadata } from "next";
import { ProjectDetailClient } from "./client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPortfolioBySlug(slug);
  if (!project) return {};
  return { title: project.title, description: project.description };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getPortfolioBySlug(slug);
  if (!project) notFound();

  const [relatedPosts, allCategories] = await Promise.all([
    getPortfolioPosts(project.id),
    getCategories(),
  ]);

  const postsWithCategory = relatedPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      titleEn: post.titleEn || null,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
    };
  });

  return (
    <ProjectDetailClient
      project={project}
      relatedPosts={postsWithCategory}
    />
  );
}
