"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalized } from "@/i18n/provider";

interface Category { id: number; parentId?: number | null; name: string; nameEn: string; slug: string; }
interface Tag { id: number; name: string; nameEn: string; }

export function FilterBar({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  const pathname = usePathname();
  const localized = useLocalized();

  // 최상위 카테고리만 표시
  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href="/posts"
        className={`px-3 py-1 rounded-md text-sm transition-colors ${
          pathname === "/posts"
            ? "bg-accent text-bg-primary font-medium"
            : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
        }`}
      >
        All
      </Link>
      {topLevel.map((cat) => {
        const children = categories.filter((c) => c.parentId === cat.id);
        const isActive = pathname === `/category/${cat.slug}` || children.some((c) => pathname === `/category/${c.slug}`);

        return (
          <div key={cat.id} className="relative group">
            <Link
              href={`/category/${cat.slug}`}
              className={`px-3 py-1 rounded-md text-sm transition-colors inline-flex items-center gap-1 ${
                isActive
                  ? "bg-accent text-bg-primary font-medium"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              {localized(cat.name, cat.nameEn)}
              {children.length > 0 && (
                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>
            {/* Dropdown for children */}
            {children.length > 0 && (
              <div className="absolute top-full left-0 mt-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[140px]">
                {children.map((child) => {
                  const grandChildren = categories.filter((c) => c.parentId === child.id);
                  return (
                    <div key={child.id} className="relative group/sub">
                      <Link
                        href={`/category/${child.slug}`}
                        className={`block px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                          pathname === `/category/${child.slug}`
                            ? "text-accent font-medium"
                            : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                        }`}
                      >
                        {localized(child.name, child.nameEn)}
                        {grandChildren.length > 0 && (
                          <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </Link>
                      {/* Sub-dropdown */}
                      {grandChildren.length > 0 && (
                        <div className="absolute left-full top-0 ml-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all z-30 min-w-[120px]">
                          {grandChildren.map((gc) => (
                            <Link
                              key={gc.id}
                              href={`/category/${gc.slug}`}
                              className={`block px-3 py-1.5 text-xs transition-colors ${
                                pathname === `/category/${gc.slug}`
                                  ? "text-accent font-medium"
                                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                              }`}
                            >
                              {localized(gc.name, gc.nameEn)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
