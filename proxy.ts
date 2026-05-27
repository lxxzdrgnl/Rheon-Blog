import { NextResponse, type NextRequest } from "next/server";
import { matchLocale } from "@/lib/locale";
import { locales } from "@/i18n/config";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 이미 locale prefix가 있으면 통과
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return;

  // locale 판별: 쿠키 → Accept-Language → 기본 ko
  const cookie = request.cookies.get("NEXT_LOCALE")?.value ?? null;
  const locale = matchLocale(request.headers.get("accept-language"), cookie);

  request.nextUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // _next, api, my, 파일(확장자 포함), 메타데이터 파일은 제외
  matcher: ["/((?!_next|api|my|sitemap.xml|robots.txt|.*\\..*).*)"],
};
