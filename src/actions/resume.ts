"use server";

import { db } from "@/db";
import { experiences, skills, socialLinks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Experiences ──

export async function getExperiences() {
  return db.select().from(experiences).orderBy(asc(experiences.sortOrder)).all();
}

export async function createExperience(data: {
  company: string; companyEn?: string; role: string; roleEn?: string;
  description?: string; descriptionEn?: string; startDate: string; endDate?: string;
}) {
  const all = await getExperiences();
  db.insert(experiences).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateExperience(id: number, data: {
  company: string; companyEn?: string; role: string; roleEn?: string;
  description?: string; descriptionEn?: string; startDate: string; endDate?: string;
}) {
  db.update(experiences).set(data).where(eq(experiences.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteExperience(id: number) {
  db.delete(experiences).where(eq(experiences.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function reorderExperiences(orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(experiences).set({ sortOrder: i }).where(eq(experiences.id, orderedIds[i])).run();
  }
  revalidatePath("/");
  revalidatePath("/my/resume");
}

// ── Skills ──

export async function getSkills() {
  return db.select().from(skills).orderBy(asc(skills.sortOrder)).all();
}

export async function createSkill(data: { name: string; category: string; categoryEn?: string }) {
  const all = await getSkills();
  db.insert(skills).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateSkill(id: number, data: { name: string; category: string; categoryEn?: string }) {
  db.update(skills).set(data).where(eq(skills.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteSkill(id: number) {
  db.delete(skills).where(eq(skills.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

// ── Social Links ──

export async function getSocialLinks() {
  return db.select().from(socialLinks).orderBy(asc(socialLinks.sortOrder)).all();
}

export async function createSocialLink(data: { platform: string; url: string }) {
  const all = await getSocialLinks();
  db.insert(socialLinks).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateSocialLink(id: number, data: { platform: string; url: string }) {
  db.update(socialLinks).set(data).where(eq(socialLinks.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteSocialLink(id: number) {
  db.delete(socialLinks).where(eq(socialLinks.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function reorderSocialLinks(orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(socialLinks).set({ sortOrder: i }).where(eq(socialLinks.id, orderedIds[i])).run();
  }
  revalidatePath("/");
  revalidatePath("/my/resume");
}
