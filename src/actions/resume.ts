"use server";

import { db } from "@/db";
import { experiences, education, skills, socialLinks, activities } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { translateTitle, translateToEnglish } from "@/lib/translate";
import { requireAdmin } from "@/lib/admin-context";

// ── AI Translation ──

export async function translateResumeFields(
  fields: Record<string, string>,
): Promise<Record<string, string>> {
  await requireAdmin();
  const result: Record<string, string> = {};
  const entries = Object.entries(fields).filter(([, v]) => v.trim());
  const translations = await Promise.all(
    entries.map(([key, value]) =>
      key === "about" || key === "description"
        ? translateToEnglish(value)
        : translateTitle(value),
    ),
  );
  entries.forEach(([key], i) => {
    result[key] = translations[i];
  });
  return result;
}

// ── Experiences ──

export async function getExperiences() {
  return db.select().from(experiences).orderBy(asc(experiences.sortOrder)).all();
}

export async function createExperience(data: {
  company: string; companyEn?: string; role: string; roleEn?: string;
  description?: string; descriptionEn?: string; startDate: string; endDate?: string;
}) {
  await requireAdmin();
  const all = await getExperiences();
  db.insert(experiences).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateExperience(id: number, data: {
  company: string; companyEn?: string; role: string; roleEn?: string;
  description?: string; descriptionEn?: string; startDate: string; endDate?: string;
}) {
  await requireAdmin();
  db.update(experiences).set(data).where(eq(experiences.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteExperience(id: number) {
  await requireAdmin();
  db.delete(experiences).where(eq(experiences.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function reorderExperiences(orderedIds: number[]) {
  await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(experiences).set({ sortOrder: i }).where(eq(experiences.id, orderedIds[i])).run();
  }
  revalidatePath("/");
  revalidatePath("/my/resume");
}

// ── Education ──

export async function getEducation() {
  return db.select().from(education).orderBy(asc(education.sortOrder)).all();
}

export async function createEducation(data: {
  school: string; schoolEn?: string; degree?: string; degreeEn?: string;
  field?: string; fieldEn?: string; description?: string; descriptionEn?: string;
  startDate: string; endDate?: string;
}) {
  await requireAdmin();
  const all = await getEducation();
  db.insert(education).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateEducation(id: number, data: {
  school: string; schoolEn?: string; degree?: string; degreeEn?: string;
  field?: string; fieldEn?: string; description?: string; descriptionEn?: string;
  startDate: string; endDate?: string;
}) {
  await requireAdmin();
  db.update(education).set(data).where(eq(education.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteEducation(id: number) {
  await requireAdmin();
  db.delete(education).where(eq(education.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function reorderEducation(orderedIds: number[]) {
  await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(education).set({ sortOrder: i }).where(eq(education.id, orderedIds[i])).run();
  }
  revalidatePath("/");
  revalidatePath("/my/resume");
}

// ── Skills ──

export async function getSkills() {
  return db.select().from(skills).orderBy(asc(skills.sortOrder)).all();
}

export async function createSkill(data: { name: string; category: string; categoryEn?: string }) {
  await requireAdmin();
  const all = await getSkills();
  db.insert(skills).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateSkill(id: number, data: { name: string; category: string; categoryEn?: string }) {
  await requireAdmin();
  db.update(skills).set(data).where(eq(skills.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteSkill(id: number) {
  await requireAdmin();
  db.delete(skills).where(eq(skills.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

// ── Activities ──

export async function getActivities() {
  return db.select().from(activities).orderBy(asc(activities.sortOrder)).all();
}

export async function createActivity(data: {
  title: string; titleEn?: string; organization: string; organizationEn?: string;
  date: string; description?: string; descriptionEn?: string; link?: string;
}) {
  await requireAdmin();
  const all = await getActivities();
  db.insert(activities).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateActivity(id: number, data: {
  title: string; titleEn?: string; organization: string; organizationEn?: string;
  date: string; description?: string; descriptionEn?: string; link?: string;
}) {
  await requireAdmin();
  db.update(activities).set(data).where(eq(activities.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteActivity(id: number) {
  await requireAdmin();
  db.delete(activities).where(eq(activities.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function reorderActivities(orderedIds: number[]) {
  await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(activities).set({ sortOrder: i }).where(eq(activities.id, orderedIds[i])).run();
  }
  revalidatePath("/");
  revalidatePath("/my/resume");
}

// ── Social Links ──

export async function getSocialLinks() {
  return db.select().from(socialLinks).orderBy(asc(socialLinks.sortOrder)).all();
}

export async function createSocialLink(data: { platform: string; url: string }) {
  await requireAdmin();
  const all = await getSocialLinks();
  db.insert(socialLinks).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateSocialLink(id: number, data: { platform: string; url: string }) {
  await requireAdmin();
  db.update(socialLinks).set(data).where(eq(socialLinks.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteSocialLink(id: number) {
  await requireAdmin();
  db.delete(socialLinks).where(eq(socialLinks.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function reorderSocialLinks(orderedIds: number[]) {
  await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(socialLinks).set({ sortOrder: i }).where(eq(socialLinks.id, orderedIds[i])).run();
  }
  revalidatePath("/");
  revalidatePath("/my/resume");
}
