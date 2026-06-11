import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostBySlug, getPostTags, getOtherPostsInCategory, getRecentPostsWithComments } from "@/actions/posts";
import { getCategories, getCategoryTree, getPublishedCategoryCounts } from "@/actions/categories";
import { getSiteViewStats } from "@/actions/stats";
import { getSetting } from "@/actions/settings";
import { getSeriesById, getSeriesPosts } from "@/actions/series";
import { getProjectsForPost } from "@/actions/portfolios";
import { pageMetadata, articleJsonLd } from "@/lib/seo";
import { excerptFromMarkdown } from "@/lib/markdown";
import { JsonLd } from "@/components/seo/JsonLd";
import { PostDetailClient } from "./client";

interface Props { params: Promise<{ locale: string; slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const isEn = loc === "en";
  const title = isEn && post.titleEn ? post.titleEn : post.title;
  const body = isEn && post.contentEn ? post.contentEn : post.content;
  const description = body.slice(0, 160);
  const path = `/post/${slug}`;
  return pageMetadata({
    title,
    description,
    path,
    locale: loc,
    type: "article",
    images: post.thumbnail ? [post.thumbnail] : undefined,
  });
}

export default async function PostPage({ params }: Props) {
  const { locale, slug } = await params;
  const isEn = locale === "en";
  const post = await getPostBySlug(slug);
  if (!post || !post.isPublished || post.isPrivate) notFound();

  const [postTags, categories, showViewCount, projects, authorName, categoryTree, categoryCounts, recentPosts, viewStats] = await Promise.all([
    getPostTags(post.id),
    getCategories(),
    getSetting("show_view_count"),
    getProjectsForPost(post.id),
    getSetting(isEn ? "resume_name_en" : "resume_name"),
    getCategoryTree(),
    getPublishedCategoryCounts(),
    getRecentPostsWithComments(post.id, 5),
    getSiteViewStats(),
  ]);

  const category = categories.find((c) => c.id === post.categoryId);
  // 같은 카테고리의 다른 글, 없으면(또는 카테고리 없음) 최신글로 폴백
  let otherPosts = category ? await getOtherPostsInCategory(category.id, post.id) : [];
  let otherIsLatest = false;
  if (otherPosts.length === 0) {
    otherPosts = await getRecentPostsWithComments(post.id);
    otherIsLatest = true;
  }

  const jsonLd = articleJsonLd({
    locale: isEn ? "en" : "ko",
    slug: post.slug,
    title: isEn && post.titleEn ? post.titleEn : post.title,
    description: excerptFromMarkdown(isEn && post.contentEn ? post.contentEn : post.content, 160),
    image: post.thumbnail,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: (authorName as string) || "rheon",
    tags: postTags.map((t) => (isEn ? t.nameEn : t.name)),
  });

  let seriesData = null;
  if (post.seriesId) {
    const [seriesInfo, seriesPosts] = await Promise.all([
      getSeriesById(post.seriesId),
      getSeriesPosts(post.seriesId),
    ]);
    if (seriesInfo) {
      const currentIndex = seriesPosts.findIndex((p) => p.id === post.id);
      seriesData = {
        title: seriesInfo.title,
        titleEn: seriesInfo.titleEn,
        posts: seriesPosts.map((p) => ({ id: p.id, title: p.title, titleEn: p.titleEn, slug: p.slug })),
        prevPost: currentIndex > 0 ? seriesPosts[currentIndex - 1] : null,
        nextPost: currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null,
      };
    }
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <PostDetailClient
        post={post}
        postTags={postTags}
        category={category || null}
        showViewCount={!!showViewCount}
        seriesData={seriesData}
        projects={projects}
        categoryTree={categoryTree}
        categoryCounts={categoryCounts}
        recentPosts={recentPosts}
        viewStats={viewStats}
        otherPosts={otherPosts}
        otherIsLatest={otherIsLatest}
      />
    </>
  );
}
