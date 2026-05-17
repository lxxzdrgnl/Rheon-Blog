import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostBySlug, getPostTags } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getSetting } from "@/actions/settings";
import { getSeriesById, getSeriesPosts } from "@/actions/series";
import { PostDetailClient } from "./client";

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.content.slice(0, 160),
    openGraph: { title: post.title, description: post.content.slice(0, 160), images: post.thumbnail ? [post.thumbnail] : [] },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.isPublished || post.isPrivate) notFound();

  const [postTags, categories, showViewCount] = await Promise.all([
    getPostTags(post.id),
    getCategories(),
    getSetting("show_view_count"),
  ]);

  const category = categories.find((c) => c.id === post.categoryId);

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
    <PostDetailClient
      post={post}
      postTags={postTags}
      category={category || null}
      showViewCount={!!showViewCount}
      seriesData={seriesData}
    />
  );
}
