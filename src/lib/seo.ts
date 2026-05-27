import type { Metadata } from "next";
import { SITE_URL } from "@/lib/locale";
import { locales, type Locale } from "@/i18n/config";

/** locale 없는 경로(path, 예 "/post/abc" 또는 "")로 canonical + hreflang alternates 생성 */
export function alternates(path: string, locale: Locale): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${path}`;
  return { canonical: `${SITE_URL}/${locale}${path}`, languages };
}

/** OG/Twitter 공통 메타 생성 */
export function socialMeta(opts: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  type?: "website" | "article";
  images?: string[];
}): Pick<Metadata, "openGraph" | "twitter"> {
  const url = `${SITE_URL}/${opts.locale}${opts.path}`;
  const images = opts.images && opts.images.length ? opts.images : ["/opengraph-image"];
  return {
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "rheon blog",
      locale: opts.locale === "ko" ? "ko_KR" : "en_US",
      type: opts.type ?? "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images,
    },
  };
}
