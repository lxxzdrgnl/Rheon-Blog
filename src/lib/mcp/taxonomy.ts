import { db } from "@/db";
import { tags, series } from "@/db/schema";
import { generateSlug } from "@/lib/slug";
import { translateTitle } from "@/lib/translate";

const norm = (s: string) => s.trim().toLowerCase();

/** 번역 실패/키 없음 시 한글명 복사 폴백. */
async function toEnglish(name: string): Promise<string> {
  try {
    const en = await translateTitle(name);
    return en?.trim() || name;
  } catch {
    return name;
  }
}

/** 태그 이름 배열 → 태그 id 배열. name·nameEn 매칭, 없으면 생성. 입력 순서/중복 보존. */
export async function resolveTags(names: string[]): Promise<number[]> {
  const existing = db.select().from(tags).all();
  const byNorm = new Map<string, number>();
  for (const t of existing) {
    byNorm.set(norm(t.name), t.id);
    if (t.nameEn) byNorm.set(norm(t.nameEn), t.id);
  }
  const out: number[] = [];
  for (const raw of names) {
    const key = norm(raw);
    let id = byNorm.get(key);
    if (id === undefined) {
      const created = db
        .insert(tags)
        .values({ name: raw.trim(), nameEn: await toEnglish(raw.trim()) })
        .returning()
        .get();
      id = created.id;
      byNorm.set(norm(created.name), id);
      if (created.nameEn) byNorm.set(norm(created.nameEn), id);
    }
    out.push(id);
  }
  return out;
}

/** 시리즈 이름 → 시리즈 id (없으면 생성). 빈 입력은 null. */
export async function resolveSeries(name: string | undefined): Promise<number | null> {
  if (!name || !name.trim()) return null;
  const key = norm(name);
  const existing = db.select().from(series).all();
  const match = existing.find(
    (s) => norm(s.title) === key || (s.titleEn && norm(s.titleEn) === key),
  );
  if (match) return match.id;
  const titleEn = await toEnglish(name.trim());
  const created = db
    .insert(series)
    .values({ title: name.trim(), titleEn, slug: generateSlug(titleEn || name) })
    .returning()
    .get();
  return created.id;
}
