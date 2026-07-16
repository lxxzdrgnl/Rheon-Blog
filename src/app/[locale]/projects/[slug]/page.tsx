import { notFound } from "next/navigation";
import { getPortfolioBySlug, getPortfolioPosts } from "@/actions/portfolios";
import { getCategories, getCategoryTree, getPublishedCategoryCounts } from "@/actions/categories";
import { getAllPostTags, getRecentPostsWithComments } from "@/actions/posts";
import { getSiteViewStats } from "@/actions/stats";
import { getSocialLinks } from "@/actions/resume";
import { getSettings } from "@/actions/settings";
import { Metadata } from "next";
import { pageMetadata, creativeWorkJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
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
  return pageMetadata({
    title,
    description,
    path,
    locale: loc,
    type: "article",
    images: project.thumbnail ? [project.thumbnail] : undefined,
  });
}

export default async function ProjectDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const isEn = locale === "en";
  const project = await getPortfolioBySlug(slug);
  if (!project) notFound();

  const [relatedPosts, allCategories, postTagsMap, categoryTree, categoryCounts, recentPosts, viewStats, socialLinks, settings] = await Promise.all([
    getPortfolioPosts(project.id),
    getCategories(),
    getAllPostTags(),
    getCategoryTree(),
    getPublishedCategoryCounts(),
    getRecentPostsWithComments(-1, 5),
    getSiteViewStats(),
    getSocialLinks(),
    getSettings(),
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

  const githubSocial = socialLinks.find((l) => l.platform.toLowerCase() === "github");
  const myName =
    (isEn ? (settings.resume_name_en as string) : "") || (settings.resume_name as string) || "";
  const me = { name: myName, github: githubSocial?.url ?? null };

  const loc = isEn ? "en" : "ko";
  const name = isEn && project.titleEn ? project.titleEn : project.title;
  const jsonLd = [
    creativeWorkJsonLd({
      locale: loc,
      path: `/projects/${slug}`,
      name,
      description: (isEn && project.descriptionEn ? project.descriptionEn : project.description) || "",
      image: project.thumbnail,
      keywords: JSON.parse(project.techStack || "[]") as string[],
    }),
    breadcrumbJsonLd(
      [
        { name: isEn ? "Home" : "홈", path: "" },
        { name: isEn ? "Projects" : "프로젝트", path: "/projects" },
        { name, path: `/projects/${slug}` },
      ],
      loc,
    ),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProjectDetailClient
        project={project}
        me={me}
        relatedPosts={postsWithCategory}
        categoryTree={categoryTree}
        categoryCounts={categoryCounts}
        recentPosts={recentPosts}
        viewStats={viewStats}
      />
    </>
  );
}
