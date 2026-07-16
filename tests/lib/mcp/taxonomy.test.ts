import { describe, it, expect, beforeEach, vi } from "vitest";
import * as schema from "@/db/schema";

// translate 모킹: 영문명은 "EN:" 접두사로 흉내
vi.mock("@/lib/translate", () => ({
  translateTitle: vi.fn(async (s: string) => `EN:${s}`),
}));

// @/db를 in-memory DB로 교체.
// vi.mock 팩토리는 hoisting되지만 import처럼 트랜스파일되므로 동적 import나 require 사용.
// 팩토리 내부에서 DB를 생성하고 모듈 캐시에 올린다.
// 그 후 테스트에서 `import { db } from "@/db"`로 같은 인스턴스를 가져온다.
// 테스트 DB는 drizzle/*.sql(적용되지 않는 낡은 생성 산출물)이 아니라
// src/db/schema.ts에서 직접 유도한다 (tests/helpers/testDb.ts 참고).
vi.mock("@/db", async () => {
  const { createTestDb } = await import("../../helpers/testDb");
  return { db: createTestDb() };
});

// 이 import는 vi.mock이 처리한 가짜 모듈에서 온다
import { db } from "@/db";
import { resolveTags, resolveSeries } from "@/lib/mcp/taxonomy";

const { tags, series } = schema;

beforeEach(() => {
  db.delete(tags).run();
  db.delete(series).run();
});

describe("resolveTags", () => {
  it("기존 태그는 name으로 매칭해 재사용한다", async () => {
    const t = db.insert(tags).values({ name: "리액트", nameEn: "React" }).returning().get();
    const ids = await resolveTags(["리액트"]);
    expect(ids).toEqual([t.id]);
  });
  it("기존 태그를 nameEn(영문)으로도 매칭한다", async () => {
    const t = db.insert(tags).values({ name: "리액트", nameEn: "React" }).returning().get();
    const ids = await resolveTags(["react"]); // 대소문자 무시
    expect(ids).toEqual([t.id]);
  });
  it("없는 태그는 생성하고 nameEn은 번역으로 채운다", async () => {
    const ids = await resolveTags(["넥스트"]);
    const created = db.select().from(tags).all();
    expect(created).toHaveLength(1);
    expect(created[0].name).toBe("넥스트");
    expect(created[0].nameEn).toBe("EN:넥스트");
    expect(ids).toEqual([created[0].id]);
  });
  it("중복 이름은 한 번만 처리한다", async () => {
    const ids = await resolveTags(["x", "x", " X "]);
    expect(db.select().from(tags).all()).toHaveLength(1);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(1);
  });
});

describe("resolveSeries", () => {
  it("없으면 빈 입력에 null", async () => {
    expect(await resolveSeries(undefined)).toBeNull();
    expect(await resolveSeries("")).toBeNull();
  });
  it("기존 시리즈는 title/titleEn로 매칭", async () => {
    const s = db.insert(series).values({ title: "시리즈", titleEn: "Series", slug: "series" }).returning().get();
    expect(await resolveSeries("series")).toBe(s.id);
  });
  it("없으면 생성하고 id 반환", async () => {
    const id = await resolveSeries("새시리즈");
    const row = db.select().from(series).all();
    expect(row).toHaveLength(1);
    expect(row[0].titleEn).toBe("EN:새시리즈");
    expect(id).toBe(row[0].id);
  });
});
