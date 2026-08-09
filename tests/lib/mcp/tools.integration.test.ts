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

const { posts, tags, postTags, categories, portfolios, portfolioPosts } = schema;

beforeEach(() => {
  db.delete(postTags).run(); db.delete(portfolioPosts).run(); db.delete(posts).run();
  db.delete(portfolios).run(); db.delete(tags).run(); db.delete(categories).run();
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

describe("portfolio isPrivate (integration)", () => {
  const base = { title: "프로젝트", description: "설명", techStack: "Next.js" };

  it("create_portfolio는 isPrivate 미지정 시 공개(false)로 만든다", async () => {
    await runAsAdmin(() => TOOL_MAP.get("create_portfolio")!.handler({ ...base }));
    expect(db.select().from(portfolios).all()[0].isPrivate).toBe(false);
  });

  it("create_portfolio는 isPrivate:true를 반영한다", async () => {
    await runAsAdmin(() => TOOL_MAP.get("create_portfolio")!.handler({ ...base, isPrivate: true }));
    expect(db.select().from(portfolios).all()[0].isPrivate).toBe(true);
  });

  it("update_portfolio에서 isPrivate를 생략하면 현재 설정이 유지된다", async () => {
    await runAsAdmin(() => TOOL_MAP.get("create_portfolio")!.handler({ ...base, isPrivate: true }));
    const id = db.select().from(portfolios).all()[0].id;

    // 다른 필드만 수정 — 비공개가 조용히 풀리면 안 된다.
    await runAsAdmin(() => TOOL_MAP.get("update_portfolio")!.handler({ id, title: "이름만 변경" }));
    const after = db.select().from(portfolios).all()[0];
    expect(after.title).toBe("이름만 변경");
    expect(after.isPrivate).toBe(true);
  });

  it("공개 프로젝트도 isPrivate 생략 수정으로 비공개가 되지 않는다", async () => {
    await runAsAdmin(() => TOOL_MAP.get("create_portfolio")!.handler({ ...base }));
    const id = db.select().from(portfolios).all()[0].id;
    await runAsAdmin(() => TOOL_MAP.get("update_portfolio")!.handler({ id, description: "설명만 변경" }));
    expect(db.select().from(portfolios).all()[0].isPrivate).toBe(false);
  });

  it("update_portfolio로 공개/비공개를 양방향 전환한다", async () => {
    await runAsAdmin(() => TOOL_MAP.get("create_portfolio")!.handler({ ...base }));
    const id = db.select().from(portfolios).all()[0].id;

    await runAsAdmin(() => TOOL_MAP.get("update_portfolio")!.handler({ id, isPrivate: true }));
    expect(db.select().from(portfolios).all()[0].isPrivate).toBe(true);

    await runAsAdmin(() => TOOL_MAP.get("update_portfolio")!.handler({ id, isPrivate: false }));
    expect(db.select().from(portfolios).all()[0].isPrivate).toBe(false);
  });

  it("list_portfolios는 비공개도 포함하고, get_portfolio는 isPrivate를 돌려준다", async () => {
    await runAsAdmin(() => TOOL_MAP.get("create_portfolio")!.handler({ ...base, title: "공개" }));
    await runAsAdmin(() => TOOL_MAP.get("create_portfolio")!.handler({ ...base, title: "비공개", isPrivate: true }));

    const listed = (await TOOL_MAP.get("list_portfolios")!.handler({})) as { title: string; isPrivate: boolean }[];
    expect(listed).toHaveLength(2);
    expect(listed.find((p) => p.title === "비공개")!.isPrivate).toBe(true);

    const priv = db.select().from(portfolios).all().find((p) => p.title === "비공개")!;
    const got = (await TOOL_MAP.get("get_portfolio")!.handler({ id: priv.id })) as { isPrivate: boolean };
    expect(got.isPrivate).toBe(true);
  });

  it("공개용 조회(getPortfolios/getProjectsForPost)는 비공개를 제외한다", async () => {
    const { getPortfolios, getProjectsForPost } = await import("@/actions/portfolios");
    const cat = db.insert(categories).values({ name: "개발", nameEn: "Dev", slug: "dev-priv" }).returning().get();
    const post = db.insert(posts).values({ title: "t", content: "c", slug: "s-priv", categoryId: cat.id }).returning().get();

    await runAsAdmin(() => TOOL_MAP.get("create_portfolio")!.handler({ ...base, title: "공개", postIds: [post.id] }));
    await runAsAdmin(() => TOOL_MAP.get("create_portfolio")!.handler({ ...base, title: "비공개", isPrivate: true, postIds: [post.id] }));

    expect((await getPortfolios()).map((p) => p.title)).toEqual(["공개"]);
    expect((await getPortfolios({ includePrivate: true }))).toHaveLength(2);
    expect((await getProjectsForPost(post.id)).map((p) => p.title)).toEqual(["공개"]);
    expect(await getProjectsForPost(post.id, { includePrivate: true })).toHaveLength(2);
  });
});
