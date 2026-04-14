import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);
const getJwtRefreshSecret = () => new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/my/login") {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (accessToken) {
    try {
      await jwtVerify(accessToken, getJwtSecret());
      return NextResponse.next();
    } catch {
      // access expired, try refresh
    }
  }

  if (refreshToken) {
    try {
      const { payload } = await jwtVerify(refreshToken, getJwtRefreshSecret());
      const userId = payload.userId as string;

      const newAccessToken = await new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("15m")
        .sign(getJwtSecret());

      const response = NextResponse.next();
      response.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });
      return response;
    } catch {
      // refresh also expired
    }
  }

  return NextResponse.redirect(new URL("/my/login", request.url));
}

export const config = {
  matcher: "/my/:path((?!login).*)",
};
