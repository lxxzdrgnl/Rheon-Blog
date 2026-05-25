import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parentId: integer("parent_id"),
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
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  publishedAt: text("published_at"),
  seriesId: integer("series_id").references(() => series.id),
  seriesOrder: integer("series_order"),
  thumbnailTextLength: integer("thumbnail_text_length"),
  thumbnailTextLengthEn: integer("thumbnail_text_length_en"),
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

export const portfolios = sqliteTable("portfolios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  content: text("content"), // 마크다운 세부 설명
  contentEn: text("content_en"),
  techStack: text("tech_stack").notNull(), // JSON array
  link: text("link"),
  icon: text("icon"), // favicon / site icon URL
  thumbnail: text("thumbnail"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const portfolioPosts = sqliteTable("portfolio_posts", {
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id),
  postId: integer("post_id").notNull().references(() => posts.id),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const experiences = sqliteTable("experiences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  companyEn: text("company_en"),
  role: text("role").notNull(),
  roleEn: text("role_en"),
  description: text("description"),
  descriptionEn: text("description_en"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  links: text("links"), // JSON array of { label, url }
  sortOrder: integer("sort_order").notNull().default(0),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  organization: text("organization").notNull(),
  organizationEn: text("organization_en"),
  date: text("date").notNull(),
  description: text("description"),
  descriptionEn: text("description_en"),
  link: text("link"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  categoryEn: text("category_en"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const education = sqliteTable("education", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  school: text("school").notNull(),
  schoolEn: text("school_en"),
  degree: text("degree"),
  degreeEn: text("degree_en"),
  field: text("field"),
  fieldEn: text("field_en"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  description: text("description"),
  descriptionEn: text("description_en"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const socialLinks = sqliteTable("social_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const series = sqliteTable("series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionEn: text("description_en"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
