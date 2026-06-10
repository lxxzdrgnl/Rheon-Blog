"use server";

import { db } from "@/db";
import { categories, posts } from "@/db/schema";
import { eq, sql, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";
import { buildTree as buildTreeUtil, getAncestorPath } from "@/lib/tree";
import { requireAdmin } from "@/lib/admin-context";

export async function getCategories() {
  return db.select().from(categories).all();
}

export interface CategoryWithCount {
  id: number;
  parentId: number | null;
  name: string;
  nameEn: string;
  slug: string;
  postCount: number;
}

export async function getCategoriesWithCount(): Promise<CategoryWithCount[]> {
  // 카테고리별 글 수: 상관 서브쿼리(drizzle 렌더링 이슈로 0 반환)를 피해
  // 글을 category_id로 집계한 뒤 매핑한다.
  const counts = db
    .select({ categoryId: posts.categoryId, count: sql<number>`COUNT(*)` })
    .from(posts)
    .groupBy(posts.categoryId)
    .all();
  const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.count)]));
  return db
    .select()
    .from(categories)
    .all()
    .map((c) => ({
      id: c.id,
      parentId: c.parentId,
      name: c.name,
      nameEn: c.nameEn,
      slug: c.slug,
      postCount: countMap.get(c.id) ?? 0,
    }));
}

export async function updateCategory(id: number, data: { name: string; nameEn: string }) {
  await requireAdmin();
  // 슬러그는 URL 안정성을 위해 변경하지 않고 이름만 수정한다.
  db.update(categories).set({ name: data.name, nameEn: data.nameEn }).where(eq(categories.id, id)).run();
  revalidatePath("/my/settings");
  revalidatePath("/my/posts");
  revalidatePath("/");
}

export async function getCategoryTree() {
  const all = await getCategoriesWithCount();
  return buildTreeUtil(all);
}

export async function getCategoryPath(categoryId: number): Promise<string[]> {
  const all = await getCategories();
  return getAncestorPath(all, categoryId);
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const nameEn = formData.get("nameEn") as string;
  const parentId = formData.get("parentId") ? Number(formData.get("parentId")) : null;
  const slug = generateSlug(nameEn);

  db.insert(categories).values({ name, nameEn, slug, parentId }).run();
  revalidatePath("/my/settings");
  revalidatePath("/");
}

export async function deleteCategory(id: number) {
  await requireAdmin();
  // Check posts
  const postCount = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(posts)
    .where(eq(posts.categoryId, id))
    .get();

  if (postCount && postCount.count > 0) {
    return { error: "글이 있는 카테고리는 삭제할 수 없습니다." };
  }

  // Check children
  const childCount = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(categories)
    .where(eq(categories.parentId, id))
    .get();

  if (childCount && childCount.count > 0) {
    return { error: "하위 카테고리가 있는 카테고리는 삭제할 수 없습니다." };
  }

  db.delete(categories).where(eq(categories.id, id)).run();
  revalidatePath("/my/settings");
  revalidatePath("/");
}
