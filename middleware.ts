import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/auth";
import { SignJWT } from "jose";

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/my/login" || pathname.startsWith("/api/view") || pathname.startsWith("/api/favicon") || pathname.startsWith("/api/og")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Valid access token
  if (accessToken && (await verifyAccessToken(accessToken))) {
    return NextResponse.next();
  }

  // Try refresh
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

  // API routes return 401 instead of redirect
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/my/login", request.url));
}

export const config = {
  matcher: ["/my/:path((?!login).*)", "/api/:path*"],
};
