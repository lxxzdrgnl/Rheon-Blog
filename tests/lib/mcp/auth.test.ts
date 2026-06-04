import { describe, it, expect } from "vitest";
import { verifyBearer } from "@/lib/mcp/auth";

describe("verifyBearer", () => {
  const token = "s3cret-token";
  it("정확한 Bearer 토큰이면 true", () => {
    expect(verifyBearer(`Bearer ${token}`, token)).toBe(true);
  });
  it("토큰 불일치면 false", () => {
    expect(verifyBearer("Bearer wrong", token)).toBe(false);
  });
  it("Bearer 접두사 없으면 false", () => {
    expect(verifyBearer(token, token)).toBe(false);
  });
  it("헤더가 null이면 false", () => {
    expect(verifyBearer(null, token)).toBe(false);
  });
  it("서버 토큰이 비어 있으면(미설정) 항상 false", () => {
    expect(verifyBearer(`Bearer ${token}`, "")).toBe(false);
    expect(verifyBearer(`Bearer ${token}`, undefined)).toBe(false);
  });
});
