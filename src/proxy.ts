import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth";
import { SignJWT } from "jose";
import { matchLocale } from "@/lib/locale";
import { locales } from "@/i18n/config";

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== Admin/API 인증 (기존 middleware 로직) =====
  if (pathname === "/my" || pathname.startsWith("/my/") || pathname.startsWith("/api")) {
    // 공개 허용 경로
    if (
      pathname === "/my/login" ||
      pathname.startsWith("/api/view") ||
      pathname.startsWith("/api/favicon") ||
      pathname.startsWith("/api/og")
    ) {
      return NextResponse.next();
    }

    const accessToken = request.cookies.get("access_token")?.value;
    const refreshToken = request.cookies.get("refresh_token")?.value;

    // 유효한 access token
    if (accessToken && (await verifyAccessToken(accessToken))) {
      return NextResponse.next();
    }

    // refresh 시도
    if (refreshToken) {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload) {
        const newAccessToken = await new SignJWT({ userId: payload.userId })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("15m")
          .sign(getSecret());

        const response = NextResponse.next();
        response.cookies.set("access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60,
          path: "/",
        });
        return response;
      }
    }

    // API 라우트는 redirect 대신 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/my/login", request.url));
  }

  // ===== i18n locale 리다이렉트 (공개 경로) =====
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  // locale 판별: 쿠키 → Accept-Language → 기본 ko
  const cookie = request.cookies.get("NEXT_LOCALE")?.value ?? null;
  const locale = matchLocale(request.headers.get("accept-language"), cookie);

  request.nextUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // 정적 파일·_next·메타데이터 파일 제외. 나머지(공개 + /my + /api) 전부 매칭.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)"],
};
