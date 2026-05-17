"use server";

import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { eq, desc, and, sql, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";
import { extractImageUrls, getOrphanedImages } from "@/lib/markdown";
import { deleteImages, rewriteImageUrl, rewriteContentUrls } from "@/lib/minio";
import { translateToEnglish, translateTitle, translatePartial } from "@/lib/translate";

export async function getPosts(options?: {
  published?: boolean;
  categoryId?: number;
  limit?: number;
  offset?: number;
}) {
  let query = db.select().from(posts).orderBy(desc(posts.createdAt));

  const conditions = [];
  if (options?.published !== undefined) {
    conditions.push(eq(posts.isPublished, options.published));
    // 공개 글 조회 시 비공개 제외
    if (options.published) {
      conditions.push(eq(posts.isPrivate, false));
    }
  }
  if (options?.categoryId) {
    conditions.push(eq(posts.categoryId, options.categoryId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }

  return query.all().map((p) => ({
    ...p,
    thumbnail: rewriteImageUrl(p.thumbnail),
    content: rewriteContentUrls(p.content),
    contentEn: rewriteContentUrls(p.contentEn),
  }));
}

export async function getPostStats() {
  const result = db
    .select({
      total: sql<number>`COUNT(*)`,
      published: sql<number>`SUM(CASE WHEN is_published = 1 AND is_private = 0 THEN 1 ELSE 0 END)`,
      drafts: sql<number>`SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END)`,
      totalViews: sql<number>`COALESCE(SUM(view_count), 0)`,
    })
    .from(posts)
    .get();
  return {
    published: result?.published ?? 0,
    drafts: result?.drafts ?? 0,
    totalViews: result?.totalViews ?? 0,
  };
}

export async function getPostBySlug(slug: string) {
  const p = db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!p) return p;
  return { ...p, thumbnail: rewriteImageUrl(p.thumbnail), content: rewriteContentUrls(p.content), contentEn: rewriteContentUrls(p.contentEn) };
}

export async function getPostById(id: number) {
  const p = db.select().from(posts).where(eq(posts.id, id)).get();
  if (!p) return p;
  return { ...p, thumbnail: rewriteImageUrl(p.thumbnail), content: rewriteContentUrls(p.content), contentEn: rewriteContentUrls(p.contentEn) };
}

export async function getPostTags(postId: number) {
  return db
    .select({ id: tags.id, name: tags.name, nameEn: tags.nameEn })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .all();
}

export async function getAllPostTags(): Promise<Record<number, { name: string; nameEn: string }[]>> {
  const all = db
    .select({ postId: postTags.postId, name: tags.name, nameEn: tags.nameEn })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .all();

  const map: Record<number, { name: string; nameEn: string }[]> = {};
  for (const row of all) {
    if (!map[row.postId]) map[row.postId] = [];
    map[row.postId].push({ name: row.name, nameEn: row.nameEn });
  }
  return map;
}

export async function savePost(formData: FormData) {
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const categoryId = Number(formData.get("categoryId"));
  const thumbnail = (formData.get("thumbnail") as string) || null;
  let slug = (formData.get("slug") as string) || generateSlug(title);
  const tagIds = JSON.parse((formData.get("tagIds") as string) || "[]") as number[];
  const seriesId = formData.get("seriesId") ? Number(formData.get("seriesId")) : null;
  const seriesOrder = formData.get("seriesOrder") ? Number(formData.get("seriesOrder")) : null;
  const thumbnailTextLength = formData.get("thumbnailTextLength") ? Number(formData.get("thumbnailTextLength")) : null;
  const publish = formData.get("publish") === "true";
  const isPrivate = formData.get("isPrivate") === "true";

  // Ensure unique slug in a single query
  const existingSlugs = db
    .select({ slug: posts.slug, id: posts.id })
    .from(posts)
    .where(like(posts.slug, `${slug}%`))
    .all();
  const takenSlugs = new Set(existingSlugs.filter((e) => !(id && e.id === id)).map((e) => e.slug));
  if (takenSlugs.has(slug)) {
    let counter = 1;
    while (takenSlugs.has(`${slug}-${counter}`)) counter++;
    slug = `${slug}-${counter}`;
  }

  let postId: number;

  if (id) {
    const existing = db.select().from(posts).where(eq(posts.id, id)).get();
    if (existing) {
      const orphaned = getOrphanedImages(existing.content, content, existing.thumbnail, thumbnail);
      if (orphaned.length > 0) {
        await deleteImages(orphaned);
      }
    }

    db.update(posts)
      .set({
        title, content, categoryId, thumbnail, slug,
        seriesId, seriesOrder, thumbnailTextLength,
        isPublished: publish ? true : undefined,
        isPrivate: publish ? isPrivate : undefined,
        publishedAt: publish && !existing?.publishedAt ? sql`datetime('now')` : undefined,
        updatedAt: sql`datetime('now')`,
      })
      .where(eq(posts.id, id))
      .run();
    postId = id;
  } else {
    const result = db
      .insert(posts)
      .values({
        title, content, categoryId, thumbnail, slug,
        seriesId, seriesOrder, thumbnailTextLength,
        isPublished: publish,
        isPrivate: publish ? isPrivate : false,
        publishedAt: publish ? sql`datetime('now')` : undefined,
      })
      .returning()
      .get();
    postId = result.id;
  }

  db.delete(postTags).where(eq(postTags.postId, postId)).run();
  if (tagIds.length > 0) {
    db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId }))).run();
  }

  // 번역 데이터가 함께 전달된 경우 저장
  const titleEn = formData.get("titleEn") as string | null;
  const contentEn = formData.get("contentEn") as string | null;
  if (titleEn && contentEn) {
    db.update(posts)
      .set({ titleEn, contentEn })
      .where(eq(posts.id, postId))
      .run();
  }

  revalidatePath("/");
  revalidatePath(`/post/${slug}`);
  revalidatePath("/my");

  return { postId, slug };
}

export async function translatePost(
  fields: { title?: string; content?: string },
): Promise<{ titleEn?: string; contentEn?: string }> {
  const result: { titleEn?: string; contentEn?: string } = {};
  const tasks: { key: keyof typeof result; promise: Promise<string> }[] = [];

  if (fields.title) tasks.push({ key: "titleEn", promise: translateTitle(fields.title) });
  if (fields.content?.trim()) tasks.push({ key: "contentEn", promise: translateToEnglish(fields.content) });

  const results = await Promise.all(tasks.map((t) => t.promise));
  tasks.forEach((t, i) => { result[t.key] = results[i]; });

  return result;
}

export async function translateSelection(
  koreanContent: string,
  selectedKorean: string,
  existingEnglish: string,
): Promise<string> {
  return translatePartial(koreanContent, selectedKorean, existingEnglish);
}

export async function updateTranslation(formData: FormData) {
  const id = Number(formData.get("id"));
  const titleEn = formData.get("titleEn") as string;
  const contentEn = formData.get("contentEn") as string;

  db.update(posts)
    .set({ titleEn, contentEn, updatedAt: sql`datetime('now')` })
    .where(eq(posts.id, id))
    .run();

  const post = db.select().from(posts).where(eq(posts.id, id)).get();
  revalidatePath(`/post/${post?.slug}`);
  revalidatePath("/my");
}

export async function deletePost(id: number) {
  const post = db.select().from(posts).where(eq(posts.id, id)).get();
  if (post) {
    const imageUrls = extractImageUrls(post.content);
    if (post.thumbnail) imageUrls.push(post.thumbnail);
    if (imageUrls.length > 0) {
      await deleteImages(imageUrls);
    }
    db.delete(postTags).where(eq(postTags.postId, id)).run();
    db.delete(posts).where(eq(posts.id, id)).run();
  }
  revalidatePath("/");
  revalidatePath("/my");
}

export async function incrementViewCount(slug: string) {
  db.update(posts)
    .set({ viewCount: sql`view_count + 1` })
    .where(eq(posts.slug, slug))
    .run();
}
