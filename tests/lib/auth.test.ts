import { describe, it, expect, vi } from "vitest";

vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-chars-long");
vi.stubEnv("JWT_REFRESH_SECRET", "test-refresh-secret-at-least-32-chars");

import { createTokens, verifyAccessToken, verifyRefreshToken } from "@/lib/auth";

describe("auth", () => {
  it("should create and verify access token", () => {
    const { accessToken } = createTokens("admin");
    const payload = verifyAccessToken(accessToken);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("admin");
  });

  it("should create and verify refresh token", () => {
    const { refreshToken } = createTokens("admin");
    const payload = verifyRefreshToken(refreshToken);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("admin");
  });

  it("should reject invalid token", () => {
    const payload = verifyAccessToken("invalid-token");
    expect(payload).toBeNull();
  });
});
