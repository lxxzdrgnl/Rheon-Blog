"use server";

import { db } from "@/db";
import { posts, postTags, tags, portfolios, series } from "@/db/schema";
import { and, eq, or, sql, desc, asc } from "drizzle-orm";
import { getSeriesForListing } from "./series";

// 부분 문자열(substring) 매칭용 LIKE 패턴. 한국어는 복합어를 띄어쓰지 않고 조사가 붙어
// ("클래시로얄을") 토큰 검색이 잘 안 맞는다. 어디에 있든 잡히는 LIKE '%q%'가 가장 자연스럽다.
// LIKE 와일드카드(%, _)와 이스케이프 문자(\)는 escape 해서 리터럴로 취급.
function likePattern(q: string) {
  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}

// 현재 언어 필드에서만 검색 — ko면 한국어 컬럼, en이면 영어 컬럼.
export async function searchPosts(query: string, locale: string = "ko") {
  const q = query.trim();
  if (!q) return [];
  const en = locale === "en";
  const pat = likePattern(q);

  const titleMatch = en
    ? sql`${posts.titleEn} LIKE ${pat} ESCAPE '\\'`
    : sql`${posts.title} LIKE ${pat} ESCAPE '\\'`;
  const bodyMatch = en
    ? sql`${posts.contentEn} LIKE ${pat} ESCAPE '\\'`
    : sql`${posts.content} LIKE ${pat} ESCAPE '\\'`;
  // 태그 매칭 — 글에 연결된 태그 이름이 검색어를 포함하면 매칭 (언어별 컬럼)
  const tagCol = en ? sql`tg.name_en` : sql`tg.name`;
  const tagMatch = sql`EXISTS (
    SELECT 1 FROM ${postTags} pt
    JOIN ${tags} tg ON tg.id = pt.tag_id
    WHERE pt.post_id = ${posts.id} AND ${tagCol} LIKE ${pat} ESCAPE '\\'
  )`;

  return db
    .select()
    .from(posts)
    .where(and(eq(posts.isPublished, true), or(titleMatch, bodyMatch, tagMatch)))
    // 제목 매칭을 먼저, 그다음 최신순
    .orderBy(sql`CASE WHEN (${titleMatch}) THEN 0 ELSE 1 END`, desc(posts.createdAt))
    .limit(20)
    .all();
}

export async function searchPortfolios(query: string, locale: string = "ko") {
  const q = query.trim();
  if (!q) return [];
  const en = locale === "en";
  const pat = likePattern(q);

  const cond = en
    ? or(
        sql`${portfolios.titleEn} LIKE ${pat} ESCAPE '\\'`,
        sql`${portfolios.descriptionEn} LIKE ${pat} ESCAPE '\\'`,
        sql`${portfolios.contentEn} LIKE ${pat} ESCAPE '\\'`,
      )
    : or(
        sql`${portfolios.title} LIKE ${pat} ESCAPE '\\'`,
        sql`${portfolios.description} LIKE ${pat} ESCAPE '\\'`,
        sql`${portfolios.content} LIKE ${pat} ESCAPE '\\'`,
      );

  return db.select().from(portfolios).where(cond).orderBy(asc(portfolios.sortOrder)).limit(20).all();
}

export async function searchSeries(query: string, locale: string = "ko") {
  const q = query.trim();
  if (!q) return [];
  const en = locale === "en";
  const pat = likePattern(q);

  const cond = en
    ? or(
        sql`${series.titleEn} LIKE ${pat} ESCAPE '\\'`,
        sql`${series.descriptionEn} LIKE ${pat} ESCAPE '\\'`,
      )
    : or(
        sql`${series.title} LIKE ${pat} ESCAPE '\\'`,
        sql`${series.description} LIKE ${pat} ESCAPE '\\'`,
      );

  const matchedIds = new Set(
    db.select({ id: series.id }).from(series).where(cond).all().map((r) => r.id),
  );
  if (matchedIds.size === 0) return [];

  // 발행 글이 있는 시리즈만, 카드용 형태(postCount/thumbnail/lastUpdated)로 — 목록과 동일 로직 재사용
  const listing = await getSeriesForListing();
  return listing.filter((s) => matchedIds.has(s.id));
}
