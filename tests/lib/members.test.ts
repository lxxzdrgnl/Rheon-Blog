import { describe, it, expect } from "vitest";
import { parseMembers, githubHandle, normalizeMembers } from "@/lib/members";

describe("parseMembers", () => {
  it("정상 JSON 배열을 그대로 돌려준다", () => {
    const json = JSON.stringify([{ name: "이서준", github: "https://github.com/seojun", role: "프론트엔드" }]);
    expect(parseMembers(json)).toEqual([
      { name: "이서준", github: "https://github.com/seojun", role: "프론트엔드" },
    ]);
  });
  it("null·빈 문자열이면 빈 배열", () => {
    expect(parseMembers(null)).toEqual([]);
    expect(parseMembers("")).toEqual([]);
    expect(parseMembers(undefined)).toEqual([]);
  });
  it("깨진 JSON이면 빈 배열", () => {
    expect(parseMembers("{oops")).toEqual([]);
  });
  it("배열이 아닌 JSON이면 빈 배열", () => {
    expect(parseMembers('{"name":"이서준"}')).toEqual([]);
    expect(parseMembers('"문자열"')).toEqual([]);
  });
  it("name 없는 원소는 버리되 isMe 행은 남긴다", () => {
    const json = JSON.stringify([{ isMe: true, role: "설계" }, { role: "이름없음" }, { name: "박하은", role: "기획" }]);
    expect(parseMembers(json)).toEqual([
      { isMe: true, role: "설계" },
      { name: "박하은", role: "기획" },
    ]);
  });
});

describe("githubHandle", () => {
  it("URL 마지막 조각을 뽑는다", () => {
    expect(githubHandle("https://github.com/lxxzdrgnl")).toBe("lxxzdrgnl");
  });
  it("끝 슬래시를 무시한다", () => {
    expect(githubHandle("https://github.com/lxxzdrgnl/")).toBe("lxxzdrgnl");
  });
  it("URL이 아닌 문자열은 그대로", () => {
    expect(githubHandle("lxxzdrgnl")).toBe("lxxzdrgnl");
  });
  it("빈 값이면 null", () => {
    expect(githubHandle(undefined)).toBe(null);
    expect(githubHandle(null)).toBe(null);
    expect(githubHandle("")).toBe(null);
    expect(githubHandle("   ")).toBe(null);
  });
});

describe("normalizeMembers", () => {
  it("isMe 행이 없으면 빈 본인 행을 맨 앞에 만든다", () => {
    expect(normalizeMembers([{ name: "박하은", role: "기획" }])).toEqual([
      { name: "", role: "", isMe: true },
      { name: "박하은", role: "기획" },
    ]);
  });
  it("isMe 행이 뒤에 있으면 맨 앞으로 올린다", () => {
    expect(normalizeMembers([{ name: "박하은", role: "기획" }, { name: "", role: "설계", isMe: true }])).toEqual([
      { name: "", role: "설계", isMe: true },
      { name: "박하은", role: "기획" },
    ]);
  });
  it("isMe가 둘이면 첫 것만 남기고 나머지는 버린다", () => {
    expect(normalizeMembers([
      { name: "", role: "설계", isMe: true },
      { name: "", role: "중복", isMe: true },
    ])).toEqual([{ name: "", role: "설계", isMe: true }]);
  });
  it("빈 배열이면 본인 행 하나", () => {
    expect(normalizeMembers([])).toEqual([{ name: "", role: "", isMe: true }]);
  });
});
