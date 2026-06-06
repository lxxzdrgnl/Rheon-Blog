import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/locale";
import { locales } from "@/i18n/config";
import { getPosts } from "@/actions/posts";
import { getPortfolios } from "@/actions/portfolios";
import { getCategories } from "@/actions/categories";
import { getAllSeries } from "@/actions/series";
import { getTags } from "@/actions/tags";

// 런타임 DB를 읽도록 동적 생성(빌드 시점 빈 DB로 구워져 글이 누락되던 문제 방지).
export const dynamic = "force-dynamic";

const tagSlug = (nameEn: string) => nameEn.toLowerCase().replace(/\s+/g, "-");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects, cats, series, tags] = await Promise.all([
    getPosts({ published: true }),
    getPortfolios(),
    getCategories(),
    getAllSeries(),
    getTags(),
  ]);

  const paths = [
    "",
    "/posts",
    "/projects",
    ...posts.map((p) => `/post/${p.slug}`),
    ...projects.map((p) => `/projects/${p.slug}`),
    ...cats.map((c) => `/category/${c.slug}`),
    ...series.map((s) => `/series/${s.slug}`),
    ...tags.map((t) => `/tag/${tagSlug(t.nameEn)}`),
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
