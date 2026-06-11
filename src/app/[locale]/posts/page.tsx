import { PostsExplorer } from "@/components/blog/PostsExplorer";
import { PostsTabs } from "@/components/blog/PostsTabs";
import { SeriesGrid } from "@/components/blog/SeriesGrid";
import { getPosts, getAllPostTags } from "@/actions/posts";
import { getCategories, getPublishedCategoryCounts } from "@/actions/categories";
import { getSeriesForListing } from "@/actions/series";
import { SeriesEmpty } from "@/components/blog/SeriesEmpty";
import { excerptAfterFirstHeading } from "@/lib/markdown";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const title = loc === "en" ? "Posts" : "글 목록";
  const description = loc === "en" ? "All blog posts" : "전체 블로그 글 목록";
  return pageMetadata({ title, description, path: "/posts", locale: loc, type: "website" });
}

export default async function PostsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tab } = await searchParams;
  const isSeries = tab === "series";

  return (
    <div className="page-container py-4 md:py-10 space-y-4 md:space-y-8">
      <h1 className="sr-only">Posts</h1>
      <div className="animate-fade-in">
        <PostsTabs active={isSeries ? "series" : "posts"} />
      </div>
      <div key={isSeries ? "series" : "posts"} className="animate-fade-in animate-delay-1">
        {isSeries ? <SeriesView /> : <PostsView locale={locale} />}
      </div>
    </div>
  );
}

async function PostsView({ locale }: { locale: string }) {
  const en = locale === "en";
  const [allPosts, allCategories, postTagsMap, counts] = await Promise.all([
    getPosts({ published: true }),
    getCategories(),
    getAllPostTags(),
    getPublishedCategoryCounts(),
  ]);

  // 클라이언트로는 필요한 필드만 — 본문 마크다운 전체를 직렬화하지 않도록 스니펫만 넘긴다.
  const postsForClient = allPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      id: post.id,
      title: post.title,
      titleEn: post.titleEn,
      slug: post.slug,
      thumbnail: post.thumbnail,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      viewCount: post.viewCount,
      categoryId: post.categoryId,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags: postTagsMap[post.id] || [],
      thumbnailTextLength: post.thumbnailTextLength,
      thumbnailTextLengthEn: post.thumbnailTextLengthEn,
      showTitleOnThumbnail: post.showTitleOnThumbnail,
      // 첫 헤딩 다음 본문을 미리보기로 (검색 결과와 동일한 자리)
      snippet: excerptAfterFirstHeading(en ? post.contentEn || post.content : post.content),
    };
  });

  return <PostsExplorer posts={postsForClient} categories={allCategories} counts={counts} />;
}

async function SeriesView() {
  const series = await getSeriesForListing();
  if (series.length === 0) return <SeriesEmpty />;
  return <SeriesGrid series={series} />;
}
