export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { SITE_URL } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // 모든 페이지 제목 뒤에 브랜드 부착(이름/브랜드 검색 강화). 홈: "이용재 — … | Rheon's Blog"
  title: { default: "Rheon's Blog", template: "%s | Rheon's Blog" },
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
