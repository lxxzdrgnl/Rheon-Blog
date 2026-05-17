"use server";

import { db } from "@/db";
import { portfolios, portfolioPosts, posts } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";
import { translateToEnglish, translateTitle } from "@/lib/translate";
import { rewriteImageUrl, rewriteContentUrls } from "@/lib/minio";

function rewritePortfolio<T extends { thumbnail: string | null; content: string | null; contentEn: string | null }>(p: T): T {
  return { ...p, thumbnail: rewriteImageUrl(p.thumbnail), content: rewriteContentUrls(p.content), contentEn: rewriteContentUrls(p.contentEn) };
}

export async function getPortfolios() {
  return db.select().from(portfolios).orderBy(asc(portfolios.sortOrder)).all().map(rewritePortfolio);
}

export async function getPortfolioBySlug(slug: string) {
  const p = db.select().from(portfolios).where(eq(portfolios.slug, slug)).get();
  return p ? rewritePortfolio(p) : p;
}

export async function getPortfolioById(id: number) {
  const p = db.select().from(portfolios).where(eq(portfolios.id, id)).get();
  return p ? rewritePortfolio(p) : p;
}

// 포스트가 속한 프로젝트 목록
export async function getProjectsForPost(postId: number) {
  return db
    .select({ id: portfolios.id, title: portfolios.title, slug: portfolios.slug })
    .from(portfolioPosts)
    .innerJoin(portfolios, eq(portfolioPosts.portfolioId, portfolios.id))
    .where(eq(portfolioPosts.postId, postId))
    .all();
}

// 포스트의 프로젝트 연결 갱신
export async function updatePostProjects(postId: number, projectIds: number[]) {
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
      createdAt: posts.createdAt,
      categoryId: posts.categoryId,
    })
    .from(portfolioPosts)
    .innerJoin(posts, eq(portfolioPosts.postId, posts.id))
    .where(eq(portfolioPosts.portfolioId, portfolioId))
    .all();
}

export async function createPortfolio(formData: FormData) {
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
  const postIds = JSON.parse((formData.get("postIds") as string) || "[]") as number[];

  const all = await getPortfolios();
  const slug = generateSlug(titleEn || title);

  const result = db.insert(portfolios)
    .values({
      title, titleEn, slug, description, descriptionEn,
      content, contentEn,
      techStack: JSON.stringify(techStack.split(",").map((s) => s.trim()).filter(Boolean)),
      link, icon, thumbnail, sortOrder: all.length,
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
  const postIds = JSON.parse((formData.get("postIds") as string) || "[]") as number[];

  db.update(portfolios)
    .set({
      title, titleEn, description, descriptionEn,
      content, contentEn,
      techStack: JSON.stringify(techStack.split(",").map((s) => s.trim()).filter(Boolean)),
      link, icon, thumbnail,
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

export async function translatePortfolio(
  fields: { title?: string; description?: string; content?: string },
): Promise<{ titleEn?: string; descriptionEn?: string; contentEn?: string | null }> {
  const result: { titleEn?: string; descriptionEn?: string; contentEn?: string | null } = {};
  const tasks: { key: keyof typeof result; promise: Promise<string> }[] = [];

  if (fields.title) tasks.push({ key: "titleEn", promise: translateTitle(fields.title) });
  if (fields.description) tasks.push({ key: "descriptionEn", promise: translateTitle(fields.description) });
  if (fields.content?.trim()) tasks.push({ key: "contentEn", promise: translateToEnglish(fields.content) });

  const results = await Promise.all(tasks.map((t) => t.promise));
  tasks.forEach((t, i) => { result[t.key] = results[i]; });

  return result;
}

export async function deletePortfolio(id: number) {
  db.delete(portfolioPosts).where(eq(portfolioPosts.portfolioId, id)).run();
  db.delete(portfolios).where(eq(portfolios.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/projects");
}

export async function reorderPortfolios(orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(portfolios)
      .set({ sortOrder: i })
      .where(eq(portfolios.id, orderedIds[i]))
      .run();
  }
  revalidatePath("/");
  revalidatePath("/my/projects");
}
