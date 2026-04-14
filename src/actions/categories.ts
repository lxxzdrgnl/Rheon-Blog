"use server";

import { db } from "@/db";
import { categories, posts } from "@/db/schema";
import { eq, sql, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";
import { buildTree as buildTreeUtil, getAncestorPath } from "@/lib/tree";

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
  return db
    .select({
      id: categories.id,
      parentId: categories.parentId,
      name: categories.name,
      nameEn: categories.nameEn,
      slug: categories.slug,
      postCount: sql<number>`(SELECT COUNT(*) FROM posts WHERE posts.category_id = ${categories.id})`,
    })
    .from(categories)
    .all();
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
  const name = formData.get("name") as string;
  const nameEn = formData.get("nameEn") as string;
  const parentId = formData.get("parentId") ? Number(formData.get("parentId")) : null;
  const slug = generateSlug(nameEn);

  db.insert(categories).values({ name, nameEn, slug, parentId }).run();
  revalidatePath("/my/settings");
  revalidatePath("/");
}

export async function deleteCategory(id: number) {
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
