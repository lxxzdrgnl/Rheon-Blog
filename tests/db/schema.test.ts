import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

function createTestDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./drizzle" });
  return db;
}

describe("schema", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it("should insert and query a post", () => {
    const cat = db.insert(schema.categories).values({
      name: "개발", nameEn: "Development", slug: "dev",
    }).returning().get();

    const post = db.insert(schema.posts).values({
      title: "테스트", slug: "test", content: "# Hello",
      categoryId: cat.id,
    }).returning().get();

    expect(post.title).toBe("테스트");
    expect(post.isPublished).toBe(false);
    expect(post.viewCount).toBe(0);
  });

  it("should insert tags and link to post via post_tags", () => {
    const cat = db.insert(schema.categories).values({
      name: "개발", nameEn: "Dev", slug: "dev",
    }).returning().get();

    const post = db.insert(schema.posts).values({
      title: "테스트", slug: "test", content: "hello",
      categoryId: cat.id,
    }).returning().get();

    const tag = db.insert(schema.tags).values({
      name: "Next.js", nameEn: "Next.js",
    }).returning().get();

    db.insert(schema.postTags).values({
      postId: post.id, tagId: tag.id,
    }).run();

    const linked = db.select().from(schema.postTags)
      .where(eq(schema.postTags.postId, post.id)).all();
    expect(linked).toHaveLength(1);
  });

  it("should insert comment with parent_id for reply", () => {
    const cat = db.insert(schema.categories).values({
      name: "개발", nameEn: "Dev", slug: "dev",
    }).returning().get();

    const post = db.insert(schema.posts).values({
      title: "테스트", slug: "test", content: "hello",
      categoryId: cat.id,
    }).returning().get();

    const comment = db.insert(schema.comments).values({
      postId: post.id, nickname: "user1",
      password: "hashed", content: "좋은 글이네요",
    }).returning().get();

    const reply = db.insert(schema.comments).values({
      postId: post.id, parentId: comment.id,
      nickname: "user2", password: "hashed", content: "감사합니다",
    }).returning().get();

    expect(reply.parentId).toBe(comment.id);
  });

  it("should insert and query settings", () => {
    db.insert(schema.settings).values({
      key: "blog_title", value: JSON.stringify("My Blog"),
    }).run();

    const setting = db.select().from(schema.settings)
      .where(eq(schema.settings.key, "blog_title")).get();
    expect(JSON.parse(setting!.value)).toBe("My Blog");
  });
});
