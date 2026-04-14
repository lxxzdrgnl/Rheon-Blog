"use server";

import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";
import { extractImageUrls } from "@/lib/markdown";
import { deleteImages } from "@/lib/minio";
import { translateToEnglish, translateTitle } from "@/lib/translate";

export function getOrphanedImages(
  oldContent: string,
  newContent: string,
  oldThumbnail: string | null,
  newThumbnail: string | null
): string[] {
  const oldUrls = new Set([
    ...extractImageUrls(oldContent),
    ...(oldThumbnail ? [oldThumbnail] : []),
  ]);
  const newUrls = new Set([
    ...extractImageUrls(newContent),
    ...(newThumbnail ? [newThumbnail] : []),
  ]);
  return [...oldUrls].filter((url) => !newUrls.has(url));
}

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

  return query.all();
}

export async function getPostBySlug(slug: string) {
  return db.select().from(posts).where(eq(posts.slug, slug)).get();
}

export async function getPostById(id: number) {
  return db.select().from(posts).where(eq(posts.id, id)).get();
}

export async function getPostTags(postId: number) {
  return db
    .select({ id: tags.id, name: tags.name, nameEn: tags.nameEn })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .all();
}

export async function savePost(formData: FormData) {
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const categoryId = Number(formData.get("categoryId"));
  const thumbnail = (formData.get("thumbnail") as string) || null;
  const slug = (formData.get("slug") as string) || generateSlug(title);
  const tagIds = JSON.parse((formData.get("tagIds") as string) || "[]") as number[];
  const publish = formData.get("publish") === "true";

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
        isPublished: publish ? true : undefined,
        updatedAt: sql`datetime('now')`,
      })
      .where(eq(posts.id, id))
      .run();
    postId = id;
  } else {
    const result = db
      .insert(posts)
      .values({ title, content, categoryId, thumbnail, slug, isPublished: publish })
      .returning()
      .get();
    postId = result.id;
  }

  db.delete(postTags).where(eq(postTags.postId, postId)).run();
  for (const tagId of tagIds) {
    db.insert(postTags).values({ postId, tagId }).run();
  }

  if (publish) {
    const titleEn = await translateTitle(title);
    const contentEn = await translateToEnglish(content);
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
