import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/actions/posts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug);
  const title = post ? (locale === "en" && post.titleEn ? post.titleEn : post.title) : "rheon blog";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.6, display: "flex" }}>rheon blog</div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.15, display: "flex" }}>
          {title}
        </div>
        <div style={{ fontSize: 28, opacity: 0.6, display: "flex" }}>blog.rheon.kr</div>
      </div>
    ),
    size
  );
}
