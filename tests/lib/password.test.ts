import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("should hash and verify password", async () => {
    const hash = await hashPassword("test123");
    expect(hash).not.toBe("test123");
    expect(await verifyPassword("test123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
