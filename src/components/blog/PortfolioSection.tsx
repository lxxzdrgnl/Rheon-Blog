"use client";

import Link from "next/link";
import { useLocalized } from "@/i18n/provider";

interface Portfolio {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string;
  descriptionEn: string | null;
  techStack: string;
  link: string | null;
  thumbnail: string | null;
}

export function PortfolioSection({ portfolios }: { portfolios: Portfolio[] }) {
  const localized = useLocalized();

  if (portfolios.length === 0) return null;

  return (
    <section className="page-container pb-10">
      <h2 className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-text-tertiary mb-6">
        <div className="h-px flex-1 max-w-8 bg-border" />
        Projects
        <div className="h-px flex-1 bg-border" />
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portfolios.map((item) => {
          const displayTitle = localized(item.title, item.titleEn);
          const displayDesc = localized(item.description, item.descriptionEn);
          const techs: string[] = JSON.parse(item.techStack || "[]");

          return (
            <Link key={item.id} href={`/projects/${item.slug}`} className="group block">
              <article className="relative h-full p-5 rounded-xl border border-border/40 hover:border-accent/30 bg-bg-card/30 hover:bg-bg-card/60 transition-all duration-300 overflow-hidden">
                <div className="flex items-start gap-4">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={displayTitle}
                      className="w-14 h-14 rounded-lg object-cover shrink-0 border border-border/40"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                        {displayTitle}
                      </h3>
                      <svg className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -translate-x-1 group-hover:translate-x-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </div>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed line-clamp-2">{displayDesc}</p>
                  </div>
                </div>
                {techs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pl-0">
                    {techs.map((tech) => (
                      <span key={tech} className="px-2 py-0.5 text-[11px] font-medium bg-accent/8 dark:bg-accent/15 rounded text-accent">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
