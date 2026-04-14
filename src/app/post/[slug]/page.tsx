import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostBySlug, getPostTags, incrementViewCount } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getSetting } from "@/actions/settings";
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
  if (!post || !post.isPublished) notFound();

  await incrementViewCount(slug);

  const [postTags, categories, showViewCount] = await Promise.all([
    getPostTags(post.id),
    getCategories(),
    getSetting("show_view_count"),
  ]);

  const category = categories.find((c) => c.id === post.categoryId);

  return (
    <PostDetailClient
      post={post}
      postTags={postTags}
      category={category || null}
      showViewCount={!!showViewCount}
    />
  );
}
