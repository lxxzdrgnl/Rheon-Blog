"use server";

import { db } from "@/db";
import { portfolios, portfolioPosts, posts } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";
import { rewriteImageUrl, rewriteContentUrls } from "@/lib/minio";
import { requireAdmin } from "@/lib/admin-context";

function rewritePortfolio<T extends { thumbnail: string | null; content: string | null; contentEn: string | null }>(p: T): T {
  return { ...p, thumbnail: rewriteImageUrl(p.thumbnail), content: rewriteContentUrls(p.content), contentEn: rewriteContentUrls(p.contentEn) };
}

/**
 * 프로젝트 목록.
 *
 * 기본값은 "공개용" — 비공개(isPrivate) 프로젝트를 제외한다. 공개 화면이 대다수라
 * 기본을 안전한 쪽에 두고, 관리자 화면·MCP만 includePrivate로 명시적으로 열어 준다.
 * (posts는 getPosts({ published: true })일 때만 비공개를 거르지만, 프로젝트에는
 *  isPublished가 없어 "공개 조회"를 나타낼 다른 플래그가 없다.)
 */
export async function getPortfolios(options?: { includePrivate?: boolean }) {
  const query = db.select().from(portfolios);
  const rows = options?.includePrivate
    ? query.orderBy(asc(portfolios.sortOrder)).all()
    : query.where(eq(portfolios.isPrivate, false)).orderBy(asc(portfolios.sortOrder)).all();
  return rows.map(rewritePortfolio);
}

export async function getPortfolioBySlug(slug: string) {
  const p = db.select().from(portfolios).where(eq(portfolios.slug, slug)).get();
  return p ? rewritePortfolio(p) : p;
}

export async function getPortfolioById(id: number) {
  const p = db.select().from(portfolios).where(eq(portfolios.id, id)).get();
  return p ? rewritePortfolio(p) : p;
}

// PATCH 머지용 — rewrite 미적용 원본
export async function getPortfolioRaw(id: number) {
  return db.select().from(portfolios).where(eq(portfolios.id, id)).get() ?? null;
}

/**
 * 포스트가 속한 프로젝트 목록.
 *
 * 기본은 공개용이라 비공개 프로젝트가 빠진다(포스트 상세의 "관련 프로젝트" 링크).
 * 편집·PATCH 보존 경로(관리자 폼, MCP update_post)는 반드시 includePrivate를 켜야 한다.
 * 안 켜면 글을 저장할 때 비공개 프로젝트 연결이 조용히 끊긴다.
 */
export async function getProjectsForPost(postId: number, options?: { includePrivate?: boolean }) {
  const where = options?.includePrivate
    ? eq(portfolioPosts.postId, postId)
    : and(eq(portfolioPosts.postId, postId), eq(portfolios.isPrivate, false));
  return db
    .select({
      id: portfolios.id,
      title: portfolios.title,
      titleEn: portfolios.titleEn,
      slug: portfolios.slug,
      description: portfolios.description,
      descriptionEn: portfolios.descriptionEn,
      techStack: portfolios.techStack,
      thumbnail: portfolios.thumbnail,
      inProgress: portfolios.inProgress,
      isPrivate: portfolios.isPrivate,
    })
    .from(portfolioPosts)
    .innerJoin(portfolios, eq(portfolioPosts.portfolioId, portfolios.id))
    .where(where)
    .all()
    .map((p) => ({ ...p, thumbnail: rewriteImageUrl(p.thumbnail) }));
}

// 포스트의 프로젝트 연결 갱신
export async function updatePostProjects(postId: number, projectIds: number[]) {
  await requireAdmin();
  db.delete(portfolioPosts).where(eq(portfolioPosts.postId, postId)).run();
  if (projectIds.length > 0) {
    db.insert(portfolioPosts).values(projectIds.map((projectId) => ({ portfolioId: projectId, postId }))).onConflictDoNothing().run();
  }
  revalidatePath("/");
}

export async function getPortfolioPosts(portfolioId: number) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      titleEn: posts.titleEn,
      slug: posts.slug,
      thumbnail: posts.thumbnail,
      thumbnailTextLength: posts.thumbnailTextLength,
      thumbnailTextLengthEn: posts.thumbnailTextLengthEn,
      showTitleOnThumbnail: posts.showTitleOnThumbnail,
      createdAt: posts.createdAt,
      categoryId: posts.categoryId,
    })
    .from(portfolioPosts)
    .innerJoin(posts, eq(portfolioPosts.postId, posts.id))
    .where(eq(portfolioPosts.portfolioId, portfolioId))
    .all()
    .map((p) => ({ ...p, thumbnail: rewriteImageUrl(p.thumbnail) }));
}

export async function createPortfolio(formData: FormData) {
  await requireAdmin();
  const title = formData.get("title") as string;
  const titleEn = (formData.get("titleEn") as string) || null;
  const description = formData.get("description") as string;
  const descriptionEn = (formData.get("descriptionEn") as string) || null;
  const content = (formData.get("content") as string) || null;
  const contentEn = (formData.get("contentEn") as string) || null;
  const techStack = formData.get("techStack") as string;
  const link = (formData.get("link") as string) || null;
  const icon = (formData.get("icon") as string) || null;
  const thumbnail = (formData.get("thumbnail") as string) || null;
  const inProgress = formData.get("inProgress") === "true";
  const isTeam = formData.get("isTeam") === "true";
  // 필드가 없으면 공개(false) — 기존 동작 유지
  const isPrivate = formData.get("isPrivate") === "true";
  const members = isTeam ? (formData.get("members") as string) || null : null;
  const postIds = JSON.parse((formData.get("postIds") as string) || "[]") as number[];

  // sortOrder는 비공개까지 포함한 전체 개수 기준이어야 번호가 겹치지 않는다.
  const all = await getPortfolios({ includePrivate: true });
  const slug = generateSlug(titleEn || title);

  const result = db.insert(portfolios)
    .values({
      title, titleEn, slug, description, descriptionEn,
      content, contentEn,
      techStack: JSON.stringify(techStack.split(",").map((s) => s.trim()).filter(Boolean)),
      link, icon, thumbnail,
      inProgress, isTeam, isPrivate, members,
      sortOrder: all.length,
    })
    .returning()
    .get();

  if (postIds.length > 0) {
    db.insert(portfolioPosts).values(postIds.map((postId) => ({ portfolioId: result.id, postId }))).run();
  }

  revalidatePath("/");
  revalidatePath("/my/projects");
}

export async function updatePortfolio(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const title = formData.get("title") as string;
  const titleEn = (formData.get("titleEn") as string) || null;
  const description = formData.get("description") as string;
  const descriptionEn = (formData.get("descriptionEn") as string) || null;
  const content = (formData.get("content") as string) || null;
  const contentEn = (formData.get("contentEn") as string) || null;
  const techStack = formData.get("techStack") as string;
  const link = (formData.get("link") as string) || null;
  const icon = (formData.get("icon") as string) || null;
  const thumbnail = (formData.get("thumbnail") as string) || null;
  const inProgress = formData.get("inProgress") === "true";
  const isTeam = formData.get("isTeam") === "true";
  const members = isTeam ? (formData.get("members") as string) || null : null;
  const postIds = JSON.parse((formData.get("postIds") as string) || "[]") as number[];
  // 3상태: 필드 자체가 없으면 undefined → drizzle이 SET에서 빼므로 현재 공개설정이 보존된다.
  // ("false"로 읽어 버리면 isPrivate를 안 보내는 옛 폼·스크립트가 비공개 프로젝트를 공개로 되돌린다.)
  const rawIsPrivate = formData.get("isPrivate");
  const isPrivate = rawIsPrivate === null ? undefined : rawIsPrivate === "true";

  db.update(portfolios)
    .set({
      title, titleEn, description, descriptionEn,
      content, contentEn,
      techStack: JSON.stringify(techStack.split(",").map((s) => s.trim()).filter(Boolean)),
      link, icon, thumbnail,
      inProgress, isTeam, isPrivate, members,
    })
    .where(eq(portfolios.id, id))
    .run();

  // 관련 포스트 갱신
  db.delete(portfolioPosts).where(eq(portfolioPosts.portfolioId, id)).run();
  if (postIds.length > 0) {
    db.insert(portfolioPosts).values(postIds.map((postId) => ({ portfolioId: id, postId }))).run();
  }

  revalidatePath("/");
  revalidatePath("/my/projects");
}

export async function deletePortfolio(id: number) {
  await requireAdmin();
  db.delete(portfolioPosts).where(eq(portfolioPosts.portfolioId, id)).run();
  db.delete(portfolios).where(eq(portfolios.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/projects");
}

export async function reorderPortfolios(orderedIds: number[]) {
  await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(portfolios)
      .set({ sortOrder: i })
      .where(eq(portfolios.id, orderedIds[i]))
      .run();
  }
  revalidatePath("/");
  revalidatePath("/my/projects");
}
