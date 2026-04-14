import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  contentEn: text("content_en"),
  thumbnail: text("thumbnail"),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
});

export const postTags = sqliteTable("post_tags", {
  postId: integer("post_id").notNull().references(() => posts.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => posts.id),
  parentId: integer("parent_id"),
  nickname: text("nickname").notNull(),
  password: text("password").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
