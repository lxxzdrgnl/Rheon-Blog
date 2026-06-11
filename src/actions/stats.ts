"use server";

import { db } from "@/db";
import { posts, siteViews } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * 조회수(PV) — 글 조회 기준으로 통일.
 * - total: 여태 모든 글의 누적 조회수(posts.view_count) — 과거 포함
 * - today: 오늘(KST) 조회수(site_views) — incrementViewCount가 같은 dedup으로 함께 적립
 * 둘 다 같은 "글 조회" 이벤트(24h 글별 dedup) 기준이라 일관됨.
 */
export async function getSiteViewStats(): Promise<{ total: number; today: number }> {
  let total = 0;
  let today = 0;

  try {
    const row = db.select({ t: sql<number>`COALESCE(SUM(${posts.viewCount}), 0)` }).from(posts).get();
    total = Number(row?.t ?? 0);
  } catch {
    /* posts 없음 — 무시 */
  }

  try {
    const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const row = db.select({ c: siteViews.count }).from(siteViews).where(eq(siteViews.date, date)).get();
    today = Number(row?.c ?? 0);
  } catch {
    /* site_views 마이그레이션 전 — 무시 */
  }

  return { total, today };
}
