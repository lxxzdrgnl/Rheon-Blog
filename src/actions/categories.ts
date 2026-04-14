"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";

export async function getCategories() {
  return db.select().from(categories).all();
}

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const nameEn = formData.get("nameEn") as string;
  const slug = generateSlug(nameEn);

  db.insert(categories).values({ name, nameEn, slug }).run();
  revalidatePath("/my/settings");
  revalidatePath("/");
}

export async function deleteCategory(id: number) {
  db.delete(categories).where(eq(categories.id, id)).run();
  revalidatePath("/my/settings");
  revalidatePath("/");
}
