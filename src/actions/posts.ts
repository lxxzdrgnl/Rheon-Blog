"use server";

import { db } from "@/db";
import { posts, postTags, tags, comments, siteViews } from "@/db/schema";
import { eq, ne, desc, and, sql, like, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";
import { extractImageUrls, getOrphanedImages } from "@/lib/markdown";
import { deleteImages, rewriteImageUrl, rewriteContentUrls } from "@/lib/minio";
import { requireAdmin } from "@/lib/admin-context";

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

// PATCH 머지용 — URL rewrite 없이 저장된 원본 그대로 반환(되써넣어도 손상 없음)
export async function getPostRaw(id: number) {
  return db.select().from(posts).where(eq(posts.id, id)).get() ?? null;
}

export async function getPostTags(postId: number) {
  return db
    .select({ id: tags.id, name: tags.name, nameEn: tags.nameEn })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .all();
}

type OtherPostRow = { id: number; title: string; titleEn: string | null; slug: string; createdAt: string };

function attachCommentCounts(rows: OtherPostRow[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const countRows = db
    .select({ postId: comments.postId, c: sql<number>`COUNT(*)` })
    .from(comments)
    .where(and(inArray(comments.postId, ids), eq(comments.isDeleted, false)))
    .groupBy(comments.postId)
    .all();
  const cmap = new Map(countRows.map((r) => [r.postId, Number(r.c)]));
  return rows.map((r) => ({ ...r, commentCount: cmap.get(r.id) ?? 0 }));
}

const otherPostCols = {
  id: posts.id, title: posts.title, titleEn: posts.titleEn, slug: posts.slug, createdAt: posts.createdAt,
};

/** 같은 카테고리의 다른 공개 글 (제목·날짜·댓글수). 포스트 상세 "이 카테고리의 다른 글"용. */
export async function getOtherPostsInCategory(categoryId: number, excludePostId: number, limit = 5) {
  const rows = db
    .select(otherPostCols)
    .from(posts)
    .where(
      and(
        eq(posts.categoryId, categoryId),
        eq(posts.isPublished, true),
        eq(posts.isPrivate, false),
        ne(posts.id, excludePostId),
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .all();
  return attachCommentCounts(rows);
}

/** 최신 공개 글 (제목·날짜·댓글수). 카테고리에 다른 글이 없을 때 폴백 추천용. */
export async function getRecentPostsWithComments(excludePostId: number, limit = 5) {
  const rows = db
    .select(otherPostCols)
    .from(posts)
    .where(and(eq(posts.isPublished, true), eq(posts.isPrivate, false), ne(posts.id, excludePostId)))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .all();
  return attachCommentCounts(rows);
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
  await requireAdmin();
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
  const thumbnailTextLengthEn = formData.get("thumbnailTextLengthEn") ? Number(formData.get("thumbnailTextLengthEn")) : null;
  const showTitleOnThumbnail = formData.get("showTitleOnThumbnail") === "true";
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

  const existing = id ? db.select().from(posts).where(eq(posts.id, id)).get() : null;

  if (id) {
    if (existing) {
      const orphaned = getOrphanedImages(existing.content, content, existing.thumbnail, thumbnail);
      if (orphaned.length > 0) {
        await deleteImages(orphaned);
      }
    }

    db.update(posts)
      .set({
        title, content, categoryId, thumbnail, slug,
        seriesId, seriesOrder, thumbnailTextLength, thumbnailTextLengthEn, showTitleOnThumbnail,
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
        seriesId, seriesOrder, thumbnailTextLength, thumbnailTextLengthEn, showTitleOnThumbnail,
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

  // 시리즈에 새로 편입되는 글은 명시적 순서가 없으면 맨 뒤 순서로 자동 배치한다.
  // 기존 글들의 순서(레거시 null 포함)도 현재 표시 순서대로 정규화해 일관성을 유지한다.
  const isNewToSeries = seriesId != null && seriesOrder == null && (existing?.seriesId ?? null) !== seriesId;
  if (isNewToSeries) {
    const siblings = db
      .select({ id: posts.id, seriesOrder: posts.seriesOrder, publishedAt: posts.publishedAt, createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.seriesId, seriesId))
      .all();
    // getSeriesPosts와 동일한 정렬 기준으로 기존 글을 정렬하고, 이 글을 맨 끝에 둔다.
    const others = siblings
      .filter((p) => p.id !== postId)
      .sort((a, b) => {
        if (a.seriesOrder != null && b.seriesOrder != null) return a.seriesOrder - b.seriesOrder;
        if (a.seriesOrder != null) return -1;
        if (b.seriesOrder != null) return 1;
        return (a.publishedAt || a.createdAt).localeCompare(b.publishedAt || b.createdAt);
      });
    [...others.map((p) => p.id), postId].forEach((pid, i) => {
      db.update(posts).set({ seriesOrder: i }).where(eq(posts.id, pid)).run();
    });
  }

  // 번역 데이터가 함께 전달된 경우 저장
  const titleEn = formData.get("titleEn") as string | null;
  const contentEn = formData.get("contentEn") as string | null;
  if (titleEn || contentEn) {
    const enFields: Record<string, string> = {};
    if (titleEn) enFields.titleEn = titleEn;
    if (contentEn) enFields.contentEn = contentEn;
    db.update(posts)
      .set(enFields)
      .where(eq(posts.id, postId))
      .run();
  }

  revalidatePath("/");
  revalidatePath(`/post/${slug}`);
  revalidatePath("/my");

  return { postId, slug };
}

// 출간 설정만 부분수정(PATCH) — 본문/제목/슬러그/시리즈/태그는 건드리지 않는다.
export async function updatePublishSettings(
  id: number,
  data: {
    thumbnail: string | null;
    thumbnailTextLength: number | null;
    thumbnailTextLengthEn: number | null;
    showTitleOnThumbnail: boolean;
    isPublished: boolean;
    isPrivate: boolean;
  },
) {
  await requireAdmin();
  const existing = db.select().from(posts).where(eq(posts.id, id)).get();
  if (!existing) return;
  db.update(posts)
    .set({
      thumbnail: data.thumbnail,
      thumbnailTextLength: data.thumbnailTextLength,
      thumbnailTextLengthEn: data.thumbnailTextLengthEn,
      showTitleOnThumbnail: data.showTitleOnThumbnail,
      isPublished: data.isPublished,
      isPrivate: data.isPrivate,
      publishedAt: data.isPublished && !existing.publishedAt ? sql`datetime('now')` : undefined,
      updatedAt: sql`datetime('now')`,
    })
    .where(eq(posts.id, id))
    .run();
  revalidatePath("/");
  revalidatePath("/my");
  revalidatePath(`/post/${existing.slug}`);
}

export async function updateTranslation(formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
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

  // 네이버식 일별 조회수 총합 — /api/view의 글별 24h dedup을 통과한 조회만 카운트(관리자 포함).
  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    db.insert(siteViews)
      .values({ date: today, count: 1 })
      .onConflictDoUpdate({ target: siteViews.date, set: { count: sql`count + 1` } })
      .run();
  } catch {
    /* site_views 마이그레이션 전 — 무시 */
  }
}
