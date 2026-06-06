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

/** 빵부스러기(BreadcrumbList) — 검색결과 경로 표시 */
export function breadcrumbJsonLd(items: { name: string; path: string }[], locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}/${locale}${it.path}`,
    })),
  };
}

/** 목록성 페이지(카테고리·시리즈·목록)용 CollectionPage */
export function collectionPageJsonLd(opts: { locale: Locale; path: string; name: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description || undefined,
    url: `${SITE_URL}/${opts.locale}${opts.path}`,
    inLanguage: opts.locale,
  };
}

/** 프로젝트(포트폴리오)용 CreativeWork */
export function creativeWorkJsonLd(opts: {
  locale: Locale;
  path: string;
  name: string;
  description?: string;
  image?: string | null;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: opts.name,
    description: opts.description || undefined,
    image: opts.image ? [opts.image] : undefined,
    url: `${SITE_URL}/${opts.locale}${opts.path}`,
    inLanguage: opts.locale,
    keywords: opts.keywords && opts.keywords.length ? opts.keywords.join(", ") : undefined,
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
  // 명시 이미지(예: 글 썸네일)가 있으면 사용, 없으면 locale 기본 OG 이미지(opengraph-image.tsx).
  const images =
    opts.images && opts.images.length ? opts.images : [`${SITE_URL}/${opts.locale}/opengraph-image`];
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
