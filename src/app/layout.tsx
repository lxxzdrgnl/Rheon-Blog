export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { SITE_URL } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "My Blog",
  description: "A personal blog",
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
