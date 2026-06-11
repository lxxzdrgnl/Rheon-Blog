import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/locale";
import { locales } from "@/i18n/config";
import { getPosts } from "@/actions/posts";
import { getPortfolios } from "@/actions/portfolios";
import { getAllSeries } from "@/actions/series";

// 런타임 DB를 읽도록 동적 생성(빌드 시점 빈 DB로 구워져 글이 누락되던 문제 방지).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects, series] = await Promise.all([
    getPosts({ published: true }),
    getPortfolios(),
    getAllSeries(),
  ]);

  // 태그(/tag/*)·카테고리(/category/*) 페이지는 제거됨(카테고리는 /posts?cat= 쿼리로 대체).
  const paths = [
    "",
    "/posts",
    "/projects",
    ...posts.map((p) => `/post/${p.slug}`),
    ...projects.map((p) => `/projects/${p.slug}`),
    ...series.map((s) => `/series/${s.slug}`),
  ];

  return paths.flatMap((path) =>
    locales.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      changeFrequency: "weekly" as const,
      alternates: {
        languages: Object.fromEntries(locales.map((x) => [x, `${SITE_URL}/${x}${path}`])),
      },
    }))
  );
}
