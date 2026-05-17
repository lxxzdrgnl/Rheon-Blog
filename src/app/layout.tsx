export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/i18n/provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

function getBlogTitle(): string {
  const row = db.select().from(settings).where(eq(settings.key, "blog_title")).get();
  return row ? JSON.parse(row.value) : "My Blog";
}

export const metadata: Metadata = {
  title: "My Blog",
  description: "A personal blog",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const blogTitle = getBlogTitle();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <I18nProvider>
            <Header blogTitle={blogTitle} />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
