export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { SITE_URL } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // 기본 제목(자체 title 없는 페이지용). 글·프로젝트는 각자 제목 그대로(브랜드 미부착) —
  // 긴 제목 잘림·사이트명 중복 방지. 브랜드는 홈에서만 붙인다.
  title: "Rheon's Blog",
  description: "개인 블로그와 포트폴리오",
  alternates: {
    types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
  },
  verification: {
    other: { "naver-site-verification": "e813389b8006a7ea437864a7b2d5806909d0d592" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
