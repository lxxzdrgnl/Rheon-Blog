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
vi.mock("@/db", async () => {
  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const schemaModule = await import("@/db/schema");
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema: schemaModule });
  migrate(db, { migrationsFolder: "./drizzle" });
  return { db };
});

import { db } from "@/db";
import { TOOL_MAP } from "@/lib/mcp/tools";

const { posts, tags, postTags, categories } = schema;

beforeEach(() => {
  db.delete(postTags).run(); db.delete(posts).run(); db.delete(tags).run(); db.delete(categories).run();
});

describe("create_post (integration)", () => {
  it("새 글을 만들고 태그를 find-or-create로 연결한다", async () => {
    const cat = db.insert(categories).values({ name: "개발", nameEn: "Dev", slug: "dev" }).returning().get();
    const res = (await TOOL_MAP.get("create_post")!.handler({
      title: "테스트 글", content: "본문", categoryId: cat.id, publish: true, tags: ["Next.js", "SSE"],
    })) as { postId: number; slug: string };
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
    await TOOL_MAP.get("delete_post")!.handler({ id: p.id });
    expect(db.select().from(posts).all()).toHaveLength(0);
  });
});
