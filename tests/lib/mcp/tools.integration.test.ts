// tests/lib/mcp/tools.integration.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as schema from "@/db/schema";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/translate", () => ({
  translateTitle: vi.fn(async (s: string) => `EN:${s}`),
  translateToEnglish: vi.fn(async (s: string) => `EN:${s}`),
}));
vi.mock("@/lib/minio", () => ({
  rewriteImageUrl: (u: unknown) => u, rewriteContentUrls: (u: unknown) => u,
  deleteImages: vi.fn(async () => {}),
}));
// 테스트 DB는 drizzle/*.sql(적용되지 않는 낡은 생성 산출물)이 아니라
// src/db/schema.ts에서 직접 유도한다 (tests/helpers/testDb.ts 참고).
vi.mock("@/db", async () => {
  const { createTestDb } = await import("../../helpers/testDb");
  return { db: createTestDb() };
});

import { db } from "@/db";
import { TOOL_MAP } from "@/lib/mcp/tools";
import { runAsAdmin } from "@/lib/admin-context";

const { posts, tags, postTags, categories } = schema;

beforeEach(() => {
  db.delete(postTags).run(); db.delete(posts).run(); db.delete(tags).run(); db.delete(categories).run();
});

describe("create_post (integration)", () => {
  it("새 글을 만들고 태그를 find-or-create로 연결한다", async () => {
    const cat = db.insert(categories).values({ name: "개발", nameEn: "Dev", slug: "dev" }).returning().get();
    const res = (await runAsAdmin(() =>
      TOOL_MAP.get("create_post")!.handler({
        title: "테스트 글", content: "본문", categoryId: cat.id, publish: true, tags: ["Next.js", "SSE"],
      })
    )) as { postId: number; slug: string };
    expect(res.postId).toBeGreaterThan(0);
    const saved = db.select().from(posts).all();
    expect(saved).toHaveLength(1);
    expect(saved[0].isPublished).toBe(true);
    expect(db.select().from(tags).all()).toHaveLength(2);
    expect(db.select().from(postTags).all()).toHaveLength(2);
  });
});

describe("delete_post (integration)", () => {
  it("글을 삭제한다", async () => {
    const cat = db.insert(categories).values({ name: "개발", nameEn: "Dev", slug: "dev2" }).returning().get();
    const p = db.insert(posts).values({ title: "t", content: "c", slug: "s", categoryId: cat.id }).returning().get();
    await runAsAdmin(() => TOOL_MAP.get("delete_post")!.handler({ id: p.id }));
    expect(db.select().from(posts).all()).toHaveLength(0);
  });
});

describe("taxonomy_create (integration)", () => {
  it("category는 name·nameEn으로 생성된다", async () => {
    await runAsAdmin(() =>
      TOOL_MAP.get("taxonomy_create")!.handler({ type: "category", data: { name: "알고리즘", nameEn: "Algorithms" } })
    );
    const rows = db.select().from(categories).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("알고리즘");
    expect(rows[0].nameEn).toBe("Algorithms");
    expect(rows[0].slug).toBe("algorithms"); // "undefined"가 아님
  });
  it("nameEn 누락 시 검증 에러로 거부한다(\"undefined\" 저장 방지)", async () => {
    await expect(
      TOOL_MAP.get("taxonomy_create")!.handler({ type: "category", data: { name: "누락" } })
    ).rejects.toThrow();
    expect(db.select().from(categories).all()).toHaveLength(0);
  });
});
