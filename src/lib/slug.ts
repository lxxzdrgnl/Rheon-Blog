import { slugify } from "transliteration";

export function generateSlug(title: string): string {
  return slugify(title, { lowercase: true, separator: "-" })
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
