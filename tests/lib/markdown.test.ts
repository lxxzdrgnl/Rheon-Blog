import { describe, it, expect } from "vitest";
import { extractImageUrls } from "@/lib/markdown";

describe("extractImageUrls", () => {
  it("should extract image URLs from markdown", () => {
    const md = `
# Hello
![alt](https://minio.example.com/blog/img1.png)
some text
![](https://minio.example.com/blog/img2.jpg)
    `;
    const urls = extractImageUrls(md);
    expect(urls).toEqual([
      "https://minio.example.com/blog/img1.png",
      "https://minio.example.com/blog/img2.jpg",
    ]);
  });

  it("should return empty array for no images", () => {
    expect(extractImageUrls("# Just text")).toEqual([]);
  });

  it("should ignore non-image links", () => {
    const md = "[link](https://example.com)";
    expect(extractImageUrls(md)).toEqual([]);
  });
});
