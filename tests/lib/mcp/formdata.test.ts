import { describe, it, expect } from "vitest";
import { buildPostFormData, buildPortfolioFormData } from "@/lib/mcp/formdata";

describe("buildPostFormData", () => {
  it("필수/선택 필드와 boolean을 문자열로 직렬화한다", () => {
    const fd = buildPostFormData({
      title: "제목", content: "본문", categoryId: 3,
      publish: true, isPrivate: false, tagIds: [1, 2], seriesId: 5, seriesOrder: 2,
    });
    expect(fd.get("title")).toBe("제목");
    expect(fd.get("categoryId")).toBe("3");
    expect(fd.get("publish")).toBe("true");
    expect(fd.get("isPrivate")).toBe("false");
    expect(fd.get("tagIds")).toBe("[1,2]");
    expect(fd.get("seriesId")).toBe("5");
    expect(fd.get("seriesOrder")).toBe("2");
  });
  it("id가 있으면 포함, 없으면 미포함", () => {
    expect(buildPostFormData({ title: "t", content: "c", categoryId: 1 }).get("id")).toBeNull();
    expect(buildPostFormData({ id: 9, title: "t", content: "c", categoryId: 1 }).get("id")).toBe("9");
  });
  it("tagIds 미지정 시 빈 배열을 넣는다", () => {
    expect(buildPostFormData({ title: "t", content: "c", categoryId: 1 }).get("tagIds")).toBe("[]");
  });
});

describe("buildPortfolioFormData", () => {
  it("techStack 콤마문자열과 postIds(JSON)을 직렬화한다", () => {
    const fd = buildPortfolioFormData({
      title: "P", description: "D", techStack: "Next.js, SQLite", postIds: [4],
    });
    expect(fd.get("title")).toBe("P");
    expect(fd.get("techStack")).toBe("Next.js, SQLite");
    expect(fd.get("postIds")).toBe("[4]");
  });
});
