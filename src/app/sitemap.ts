import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/locale";
import { locales } from "@/i18n/config";
import { getPosts } from "@/actions/posts";
import { getPortfolios } from "@/actions/portfolios";
import { getCategories } from "@/actions/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects, cats] = await Promise.all([
    getPosts({ published: true }),
    getPortfolios(),
    getCategories(),
  ]);

  const paths = [
    "",
    "/posts",
    "/projects",
    ...posts.map((p) => `/post/${p.slug}`),
    ...projects.map((p) => `/projects/${p.slug}`),
    ...cats.map((c) => `/category/${c.slug}`),
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
