import { describe, it, expect } from "vitest";
import { isLocale, matchLocale, localizeHref, swapLocaleInPath, SITE_URL } from "@/lib/locale";

describe("isLocale", () => {
  it("ko/en은 true, 그 외 false", () => {
    expect(isLocale("ko")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("matchLocale", () => {
  it("쿠키가 유효하면 쿠키 우선", () => {
    expect(matchLocale("en-US,en;q=0.9", "ko")).toBe("ko");
  });
  it("쿠키 없으면 Accept-Language 첫 매칭", () => {
    expect(matchLocale("en-US,en;q=0.9", null)).toBe("en");
    expect(matchLocale("ko-KR,ko;q=0.9,en;q=0.5", null)).toBe("ko");
  });
  it("아무것도 없으면 기본 ko", () => {
    expect(matchLocale(null, null)).toBe("ko");
    expect(matchLocale("fr-FR", null)).toBe("ko");
  });
});

describe("localizeHref", () => {
  it("내부 경로에 locale prefix", () => {
    expect(localizeHref("/posts", "ko")).toBe("/ko/posts");
    expect(localizeHref("/post/abc", "en")).toBe("/en/post/abc");
    expect(localizeHref("/", "en")).toBe("/en");
    expect(localizeHref("/search?q=x", "ko")).toBe("/ko/search?q=x");
  });
  it("api/my/외부/해시/이미 prefix된 건 그대로", () => {
    expect(localizeHref("/api/og", "ko")).toBe("/api/og");
    expect(localizeHref("/my/posts", "ko")).toBe("/my/posts");
    expect(localizeHref("https://x.com", "ko")).toBe("https://x.com");
    expect(localizeHref("#heading", "ko")).toBe("#heading");
    expect(localizeHref("/ko/posts", "en")).toBe("/ko/posts");
  });
});

describe("swapLocaleInPath", () => {
  it("현재 경로의 locale 세그먼트만 교체", () => {
    expect(swapLocaleInPath("/ko/post/abc", "en")).toBe("/en/post/abc");
    expect(swapLocaleInPath("/en", "ko")).toBe("/ko");
    expect(swapLocaleInPath("/ko/search?q=x", "en")).toBe("/en/search?q=x");
  });
  it("locale 세그먼트 없으면 앞에 붙임", () => {
    expect(swapLocaleInPath("/posts", "en")).toBe("/en/posts");
    expect(swapLocaleInPath("/", "ko")).toBe("/ko");
  });
});

describe("SITE_URL", () => {
  it("절대 URL", () => {
    expect(SITE_URL).toMatch(/^https?:\/\//);
  });
});
