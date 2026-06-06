import { ImageResponse } from "next/og";
import { getSetting } from "@/actions/settings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 홈·목록·카테고리·시리즈·태그 공용 기본 OG 이미지(상세 페이지는 자체 이미지 사용).
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEn = locale === "en";
  const name = ((await getSetting(isEn ? "resume_name_en" : "resume_name")) as string) || "Rheon Lee";
  const role = ((await getSetting(isEn ? "resume_title_en" : "resume_title")) as string) || "Back-End / MLOps Developer";
  const tagline = ((await getSetting(isEn ? "resume_tagline_en" : "resume_tagline")) as string) || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 88,
          background: "linear-gradient(135deg, #0c1512 0%, #0a0a0a 55%, #0c1512 100%)",
          color: "#fafafa",
          position: "relative",
        }}
      >
        {/* 상단: 브랜드 + >_ */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #34b07d, #1f7d57)",
              color: "#fff",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            {">_"}
          </div>
          <div style={{ fontSize: 30, opacity: 0.7, display: "flex" }}>blog.rheon.kr</div>
        </div>

        {/* 중앙: 이름 + 직함 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 1.05, display: "flex" }}>{name}</div>
          <div style={{ fontSize: 44, fontWeight: 600, color: "#5eba97", display: "flex" }}>{role}</div>
        </div>

        {/* 하단: 태그라인 */}
        <div style={{ fontSize: 30, opacity: 0.65, display: "flex", maxWidth: 1000 }}>
          {tagline}
        </div>
      </div>
    ),
    size,
  );
}
