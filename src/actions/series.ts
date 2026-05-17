"use server";

import { db } from "@/db";
import { series, posts } from "@/db/schema";
import { eq, asc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";

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
}) {
  const slug = generateSlug(data.titleEn || data.title);
  const result = db.insert(series).values({ ...data, slug }).returning().get();
  revalidatePath("/my/series");
  return result;
}

export async function updateSeries(id: number, data: {
  title: string; titleEn?: string; description?: string; descriptionEn?: string;
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
