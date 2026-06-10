"use server";

import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-context";

export async function getTags() {
  return db.select().from(tags).all();
}

export async function searchTags(query: string) {
  return db.select().from(tags)
    .where(like(tags.name, `%${query}%`))
    .limit(10)
    .all();
}

export async function createTag(name: string, nameEn: string) {
  await requireAdmin();
  return db.insert(tags).values({ name, nameEn }).returning().get();
}

export async function deleteTag(id: number) {
  await requireAdmin();
  db.delete(tags).where(eq(tags.id, id)).run();
  revalidatePath("/my/settings");
}
