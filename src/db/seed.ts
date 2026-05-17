import { db } from "./index";
import { settings, categories } from "./schema";

const defaultSettings = [
  { key: "blog_title", value: JSON.stringify("My Blog") },
  { key: "blog_title_en", value: JSON.stringify("My Blog") },
  { key: "show_view_count", value: JSON.stringify(true) },
];

for (const s of defaultSettings) {
  db.insert(settings).values(s).onConflictDoNothing().run();
}

db.insert(categories).values({
  name: "미분류", nameEn: "Uncategorized", slug: "uncategorized",
}).onConflictDoNothing().run();

console.log("Seed complete");
