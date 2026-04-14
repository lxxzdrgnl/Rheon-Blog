"use server";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export async function searchPosts(query: string, locale: string = "ko") {
  if (!query.trim()) return [];

  const escapedQuery = query.replace(/['"]/g, "");

  const ftsResults = db.all(sql`
    SELECT rowid FROM posts_fts
    WHERE posts_fts MATCH ${escapedQuery}
    ORDER BY rank
    LIMIT 20
  `) as { rowid: number }[];

  if (ftsResults.length === 0) return [];

  const ids = ftsResults.map((r) => r.rowid);
  return db
    .select()
    .from(posts)
    .where(and(inArray(posts.id, ids), eq(posts.isPublished, true)))
    .all();
}
