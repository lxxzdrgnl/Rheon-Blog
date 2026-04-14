"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSetting(key: string): Promise<string | null> {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row ? JSON.parse(row.value) : null;
}

export async function getSettings(): Promise<Record<string, unknown>> {
  const rows = db.select().from(settings).all();
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.key] = JSON.parse(row.value);
  }
  return result;
}

export async function updateSetting(formData: FormData) {
  const key = formData.get("key") as string;
  const value = formData.get("value") as string;

  db.insert(settings)
    .values({ key, value: JSON.stringify(value) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value) } })
    .run();

  revalidatePath("/");
  revalidatePath("/my/settings");
}

export async function updateSettings(data: Record<string, unknown>) {
  for (const [key, value] of Object.entries(data)) {
    db.insert(settings)
      .values({ key, value: JSON.stringify(value) })
      .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value) } })
      .run();
  }

  revalidatePath("/");
  revalidatePath("/my/settings");
}
