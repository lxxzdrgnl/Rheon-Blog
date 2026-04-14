import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);
const getRefreshSecret = () => new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

interface TokenPayload {
  userId: string;
}

export async function createTokens(userId: string) {
  const accessToken = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(getSecret());

  const refreshToken = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getRefreshSecret());

  return { accessToken, refreshToken };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

export async function setAuthCookies(userId: string) {
  const { accessToken, refreshToken } = await createTokens(userId);
  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}
