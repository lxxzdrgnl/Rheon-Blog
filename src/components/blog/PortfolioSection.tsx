"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useLocalized } from "@/i18n/provider";
import { SectionHeading } from "./ExperienceSection";

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
    <section className="page-container py-8">
      <div className="h-px bg-border mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2 md:gap-8">
        <SectionHeading>Projects</SectionHeading>
        <div className="space-y-5">
          {portfolios.map((item) => {
            const displayTitle = localized(item.title, item.titleEn);
            const displayDesc = localized(item.description, item.descriptionEn);
            const techs: string[] = JSON.parse(item.techStack || "[]");

            return (
              <Link key={item.id} href={`/projects/${item.slug}`} className="group flex items-start gap-4">
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={displayTitle}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border/40 mt-0.5"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold text-[0.95rem] text-text-primary group-hover:text-accent transition-colors">
                      {displayTitle}
                    </h3>
                    <svg className="w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{displayDesc}</p>
                  {techs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {techs.map((tech) => (
                        <span key={tech} className="text-[11px] text-accent/80 font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
