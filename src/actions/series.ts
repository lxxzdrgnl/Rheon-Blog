"use server";

import { db } from "@/db";
import { series, posts } from "@/db/schema";
import { eq, asc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";
import { rewriteImageUrl } from "@/lib/minio";

export async function getAllSeries() {
  return db.select().from(series).orderBy(asc(series.createdAt)).all();
}

export async function getSeriesBySlug(slug: string) {
  return db.select().from(series).where(eq(series.slug, slug)).get();
}

export async function getSeriesById(id: number) {
  return db.select().from(series).where(eq(series.id, id)).get();
}

export async function getSeriesPosts(seriesId: number) {
  const result = db
    .select()
    .from(posts)
    .where(and(eq(posts.seriesId, seriesId), eq(posts.isPublished, true), eq(posts.isPrivate, false)))
    .all();

  return result.sort((a, b) => {
    if (a.seriesOrder != null && b.seriesOrder != null) return a.seriesOrder - b.seriesOrder;
    if (a.seriesOrder != null) return -1;
    if (b.seriesOrder != null) return 1;
    return (a.publishedAt || a.createdAt).localeCompare(b.publishedAt || b.createdAt);
  });
}

export async function createSeries(data: {
  title: string; titleEn?: string; description?: string; descriptionEn?: string;
  thumbnailTextLength?: number; thumbnailTextLengthEn?: number;
}) {
  const slug = generateSlug(data.titleEn || data.title);
  const result = db.insert(series).values({ ...data, slug }).returning().get();
  revalidatePath("/my/series");
  return result;
}

export async function updateSeries(id: number, data: {
  title: string; titleEn?: string; description?: string; descriptionEn?: string;
  thumbnailTextLength?: number; thumbnailTextLengthEn?: number;
}) {
  db.update(series).set(data).where(eq(series.id, id)).run();
  revalidatePath("/my/series");
  revalidatePath("/");
}

export async function deleteSeries(id: number) {
  db.update(posts).set({ seriesId: null, seriesOrder: null }).where(eq(posts.seriesId, id)).run();
  db.delete(series).where(eq(series.id, id)).run();
  revalidatePath("/my/series");
  revalidatePath("/");
}

export async function reorderSeriesPosts(seriesId: number, orderedPostIds: number[]) {
  for (let i = 0; i < orderedPostIds.length; i++) {
    db.update(posts)
      .set({ seriesOrder: i })
      .where(and(eq(posts.id, orderedPostIds[i]), eq(posts.seriesId, seriesId)))
      .run();
  }
  revalidatePath("/");
}

// 공개 시리즈 목록(카드용) — 게시글 1개 이상인 시리즈만. 최근 글 썸네일·마지막 업데이트·글 수 포함.
export async function getSeriesForListing() {
  const allSeries = db.select().from(series).all();
  return allSeries
    .map((s) => {
      const sp = db
        .select({ thumbnail: posts.thumbnail, publishedAt: posts.publishedAt, createdAt: posts.createdAt })
        .from(posts)
        .where(and(eq(posts.seriesId, s.id), eq(posts.isPublished, true), eq(posts.isPrivate, false)))
        .all();
      if (sp.length === 0) return null;
      const latest = [...sp].sort((a, b) =>
        (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt),
      )[0];
      return {
        id: s.id,
        title: s.title,
        titleEn: s.titleEn,
        slug: s.slug,
        postCount: sp.length,
        lastUpdated: latest.publishedAt || latest.createdAt,
        thumbnail: rewriteImageUrl(latest.thumbnail),
        thumbnailTextLength: s.thumbnailTextLength,
        thumbnailTextLengthEn: s.thumbnailTextLengthEn,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)); // 최근 업데이트 순
}

export async function getSeriesWithPostCount() {
  const allSeries = await getAllSeries();
  return Promise.all(
    allSeries.map(async (s) => {
      const postCount = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(posts)
        .where(eq(posts.seriesId, s.id))
        .get();
      return { ...s, postCount: postCount?.count || 0 };
    })
  );
}
