import type { Metadata } from "next";
import { SITE_URL } from "@/lib/locale";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

/** locale 없는 경로(path, 예 "/post/abc" 또는 "")로 canonical + hreflang alternates 생성 */
export function alternates(path: string, locale: Locale): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${path}`;
  // x-default: 언어/지역 미지정 사용자가 받을 기본 버전(= 기본 로케일)
  languages["x-default"] = `${SITE_URL}/${defaultLocale}${path}`;
  return { canonical: `${SITE_URL}/${locale}${path}`, languages };
}

/** sqlite "YYYY-MM-DD HH:MM:SS"(UTC) → ISO 8601 */
function toIso(d: string | null | undefined): string | undefined {
  if (!d) return undefined;
  const date = new Date(d.includes("T") ? d : d.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** 글 페이지용 schema.org Article(BlogPosting) 구조화 데이터 */
export function articleJsonLd(opts: {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName: string;
  tags?: string[];
}) {
  const url = `${SITE_URL}/${opts.locale}/post/${opts.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    image: opts.image ? [opts.image] : undefined,
    datePublished: toIso(opts.datePublished),
    dateModified: toIso(opts.dateModified) ?? toIso(opts.datePublished),
    author: { "@type": "Person", name: opts.authorName },
    publisher: { "@type": "Person", name: opts.authorName },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: opts.locale,
    keywords: opts.tags && opts.tags.length ? opts.tags.join(", ") : undefined,
  };
}

/** 홈(프로필)용 schema.org Person 구조화 데이터 — 이름 검색·지식패널 대응 */
export function personJsonLd(opts: {
  locale: Locale;
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  email?: string;
  sameAs?: string[];
  knowsAbout?: string[];
  alumniOf?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    url: `${SITE_URL}/${opts.locale}`,
    jobTitle: opts.jobTitle || undefined,
    description: opts.description || undefined,
    image: opts.image || undefined,
    email: opts.email || undefined,
    sameAs: opts.sameAs && opts.sameAs.length ? opts.sameAs : undefined,
    knowsAbout: opts.knowsAbout && opts.knowsAbout.length ? opts.knowsAbout : undefined,
    alumniOf:
      opts.alumniOf && opts.alumniOf.length
        ? opts.alumniOf.map((n) => ({ "@type": "CollegeOrUniversity", name: n }))
        : undefined,
  };
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
