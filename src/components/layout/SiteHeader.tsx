import { Header } from "./Header";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

function getBlogTitle(): string {
  const row = db.select().from(settings).where(eq(settings.key, "blog_title")).get();
  return row ? JSON.parse(row.value) : "Rheon's Blog";
}

export function SiteHeader() {
  return <Header blogTitle={getBlogTitle()} />;
}
