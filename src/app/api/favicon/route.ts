import { NextRequest, NextResponse } from "next/server";
import { safeFetch } from "@/lib/ssrf";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ icon: null });

  try {
    const origin = new URL(url).origin;
    const res = await safeFetch(origin, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();

    // 1) <link rel="icon" href="..."> or <link rel="shortcut icon" href="...">
    const iconMatch =
      html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);

    if (iconMatch?.[1]) {
      const href = iconMatch[1];
      const absolute = href.startsWith("http") ? href : origin + (href.startsWith("/") ? "" : "/") + href;
      return NextResponse.json({ icon: absolute }, {
        headers: { "Cache-Control": "public, max-age=604800, s-maxage=604800" },
      });
    }

    // 2) apple-touch-icon
    const appleMatch =
      html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i);

    if (appleMatch?.[1]) {
      const href = appleMatch[1];
      const absolute = href.startsWith("http") ? href : origin + (href.startsWith("/") ? "" : "/") + href;
      return NextResponse.json({ icon: absolute }, {
        headers: { "Cache-Control": "public, max-age=604800, s-maxage=604800" },
      });
    }

    // 3) fallback: /favicon.ico
    const fallback = await safeFetch(origin + "/favicon.ico", {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });
    if (fallback.ok) {
      return NextResponse.json({ icon: origin + "/favicon.ico" }, {
        headers: { "Cache-Control": "public, max-age=604800, s-maxage=604800" },
      });
    }

    return NextResponse.json({ icon: null }, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ icon: null });
  }
}
