import { describe, it, expect } from "vitest";
import { getOrphanedImages } from "@/lib/markdown";

describe("getOrphanedImages", () => {
  it("should detect removed images", () => {
    const oldContent = "![](http://minio/blog/images/a.png) ![](http://minio/blog/images/b.png)";
    const newContent = "![](http://minio/blog/images/a.png)";
    const orphaned = getOrphanedImages(oldContent, newContent, null, null);
    expect(orphaned).toEqual(["http://minio/blog/images/b.png"]);
  });

  it("should detect removed thumbnail", () => {
    const orphaned = getOrphanedImages("", "", "http://minio/blog/images/thumb.png", null);
    expect(orphaned).toEqual(["http://minio/blog/images/thumb.png"]);
  });

  it("should return empty when no images removed", () => {
    const content = "![](http://minio/blog/images/a.png)";
    const orphaned = getOrphanedImages(content, content, null, null);
    expect(orphaned).toEqual([]);
  });
});
