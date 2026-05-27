import { locales, defaultLocale, type Locale } from "@/i18n/config";

/** 배포 도메인 — OG 이미지/메타데이터 절대 URL 기준 */
export const SITE_URL = "https://blog.rheon.kr";

export function isLocale(x: string | null | undefined): x is Locale {
  return x != null && (locales as readonly string[]).includes(x);
}

/** 쿠키 → Accept-Language → 기본 locale */
export function matchLocale(
  acceptLanguage: string | null,
  cookie: string | null | undefined
): Locale {
  if (isLocale(cookie)) return cookie;
  if (acceptLanguage) {
    const tags = acceptLanguage
      .split(",")
      .map((s) => s.split(";")[0].trim().toLowerCase());
    for (const tag of tags) {
      const base = tag.split("-")[0];
      if (isLocale(base)) return base as Locale;
    }
  }
  return defaultLocale;
}

const SKIP_PREFIXES = ["/api", "/my"];

/** 내부 root-relative href에 /{locale} prefix. 외부/해시/api/my/이미prefix는 그대로 */
export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href; // 외부/해시/protocol-relative
  if (SKIP_PREFIXES.some((p) => href === p || href.startsWith(`${p}/`))) return href;
  const seg = href.split("/")[1];
  if (isLocale(seg)) return href; // 이미 prefix됨
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

/** 현재 pathname의 locale 세그먼트를 target으로 교체(없으면 앞에 붙임). 쿼리스트링 보존 */
export function swapLocaleInPath(pathname: string, target: Locale): string {
  const seg = pathname.split("/")[1];
  if (isLocale(seg)) {
    const rest = pathname.slice(seg.length + 1); // seg 이후 ("/post/abc" or "")
    return `/${target}${rest}`;
  }
  return pathname === "/" ? `/${target}` : `/${target}${pathname}`;
}
