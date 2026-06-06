import { getPosts } from "@/actions/posts";
import { getSettings } from "@/actions/settings";
import { excerptFromMarkdown } from "@/lib/markdown";
import { SITE_URL } from "@/lib/locale";

// 런타임 DB를 읽도록 동적 생성(빌드 시점 빈 DB로 구워지는 것 방지).
export const dynamic = "force-dynamic";

const ENTITIES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ENTITIES[c]);

function rfc822(d: string): string {
  const date = new Date(d.includes("T") ? d : d.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? new Date(0).toUTCString() : date.toUTCString();
}

export async function GET() {
  const [posts, settings] = await Promise.all([getPosts({ published: true }), getSettings()]);
  const title = (settings.blog_title as string) || "rheon blog";
  const description = (settings.blog_title_en as string) || title;

  const items = posts
    .slice(0, 30)
    .map((p) => {
      const url = `${SITE_URL}/ko/post/${p.slug}`;
      const summary = excerptFromMarkdown(p.content, 300);
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(p.publishedAt || p.createdAt)}</pubDate>
      <description>${esc(summary)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <link>${SITE_URL}</link>
    <description>${esc(description)}</description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
