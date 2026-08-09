import { ImageResponse } from "next/og";
import { getPortfolioBySlug } from "@/actions/portfolios";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const found = await getPortfolioBySlug(slug);
  // 비공개 프로젝트는 상세가 404이므로 OG 이미지로도 제목이 새어 나가면 안 된다.
  const project = found && !found.isPrivate ? found : null;
  const title = project ? (locale === "en" && project.titleEn ? project.titleEn : project.title) : "Project";

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
        <div style={{ fontSize: 28, opacity: 0.6, display: "flex" }}>rheon · project</div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.15, display: "flex" }}>
          {title}
        </div>
        <div style={{ fontSize: 28, opacity: 0.6, display: "flex" }}>blog.rheon.kr</div>
      </div>
    ),
    size
  );
}
