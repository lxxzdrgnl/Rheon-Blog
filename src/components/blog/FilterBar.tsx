"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/provider";

interface Category { id: number; name: string; nameEn: string; slug: string; }
interface Tag { id: number; name: string; nameEn: string; }

export function FilterBar({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  const pathname = usePathname();
  const { locale } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link href="/" className={`px-4 py-1.5 rounded-full text-sm transition-colors ${pathname === "/" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:text-text-primary"}`}>
          All
        </Link>
        {categories.map((cat) => (
          <Link key={cat.id} href={`/category/${cat.slug}`} className={`px-4 py-1.5 rounded-full text-sm transition-colors ${pathname === `/category/${cat.slug}` ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:text-text-primary"}`}>
            {locale === "en" ? cat.nameEn : cat.name}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link key={tag.id} href={`/tag/${tag.nameEn.toLowerCase().replace(/\s+/g, "-")}`} className="px-3 py-1 rounded-full text-xs bg-bg-card text-text-secondary hover:text-text-primary transition-colors">
            #{locale === "en" ? tag.nameEn : tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
