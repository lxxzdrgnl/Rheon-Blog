import { describe, it, expect } from "vitest";
import { generateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("should convert english to slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("should handle korean by romanizing", () => {
    const slug = generateSlug("Next.js 블로그 만들기");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug.length).toBeGreaterThan(0);
  });

  it("should remove special characters", () => {
    expect(generateSlug("Hello! @World#")).toBe("hello-world");
  });

  it("should trim leading/trailing hyphens", () => {
    expect(generateSlug("--hello--")).toBe("hello");
  });
});
