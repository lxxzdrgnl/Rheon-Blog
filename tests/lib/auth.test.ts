import { describe, it, expect, vi } from "vitest";

vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-chars-long");
vi.stubEnv("JWT_REFRESH_SECRET", "test-refresh-secret-at-least-32-chars");

import { createTokens, verifyAccessToken, verifyRefreshToken } from "@/lib/auth";

describe("auth", () => {
  it("should create and verify access token", async () => {
    const { accessToken } = await createTokens("admin");
    const payload = await verifyAccessToken(accessToken);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("admin");
  });

  it("should create and verify refresh token", async () => {
    const { refreshToken } = await createTokens("admin");
    const payload = await verifyRefreshToken(refreshToken);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("admin");
  });

  it("should reject invalid token", async () => {
    const payload = await verifyAccessToken("invalid-token");
    expect(payload).toBeNull();
  });
});
