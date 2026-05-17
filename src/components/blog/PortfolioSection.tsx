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
    <section className="page-container pb-12">
      <h2 className="text-lg font-bold tracking-tight mb-5"><span className="text-accent mr-1.5">/</span>Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {portfolios.map((item) => {
          const displayTitle = localized(item.title, item.titleEn);
          const displayDesc = localized(item.description, item.descriptionEn);
          const techs: string[] = JSON.parse(item.techStack || "[]");

          const inner = (
            <article className="card-hover group rounded-lg border border-border/60 hover:border-accent/30 overflow-hidden h-full flex flex-col bg-bg-primary transition-colors">
              {item.thumbnail ? (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={displayTitle}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-bg-card flex items-center justify-center px-6">
                  <h3 className="text-base font-semibold text-center">{displayTitle}</h3>
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                {item.thumbnail && <h3 className="font-semibold text-sm">{displayTitle}</h3>}
                <p className="text-sm text-text-secondary mt-2 flex-1 leading-relaxed">{displayDesc}</p>
                {techs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {techs.map((tech) => (
                      <span key={tech} className="px-2 py-0.5 text-xs bg-accent-soft rounded text-accent font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );

          return (
            <Link key={item.id} href={`/projects/${item.slug}`}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
