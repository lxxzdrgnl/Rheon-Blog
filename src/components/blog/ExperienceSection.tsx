"use client";

import { useI18n, useLocalized } from "@/i18n/provider";

interface ExperienceLink {
  label: string;
  url: string;
  image?: string | null;
}

interface Experience {
  id: number;
  company: string;
  companyEn: string | null;
  role: string;
  roleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  startDate: string;
  endDate: string | null;
  links: string | null;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold tracking-[0.25em] uppercase text-text-tertiary mb-5">
      {children}
    </h2>
  );
}

export { SectionHeading };

function LinkPreviewCard({ link }: { link: ExperienceLink }) {
  const domain = (() => {
    try { return new URL(link.url).hostname.replace("www.", ""); }
    catch { return ""; }
  })();

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-28 shrink-0"
    >
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-bg-elevated border border-border/50 group-hover:border-accent/40 transition-colors">
        {link.image ? (
          <img src={link.image} alt={link.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-tertiary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
        )}
        {/* External link badge */}
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </div>
      </div>
      <p className="text-[11px] text-text-secondary mt-1.5 line-clamp-1 group-hover:text-accent transition-colors">
        {link.label}
      </p>
    </a>
  );
}

export function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  const { t } = useI18n();
  const localized = useLocalized();

  if (experiences.length === 0) return null;

  return (
    <section className="page-container py-8">
      <div className="h-px bg-border mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2 md:gap-8">
        <SectionHeading>{t("resume.experience")}</SectionHeading>
        <div className="space-y-6">
          {experiences.map((exp) => {
            const expLinks: ExperienceLink[] = exp.links ? JSON.parse(exp.links) : [];
            return (
              <div key={exp.id}>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                  <div>
                    <h3 className="font-semibold text-[0.95rem] text-text-primary">
                      {localized(exp.role, exp.roleEn)}
                    </h3>
                    <p className="text-sm text-accent mt-0.5">
                      {localized(exp.company, exp.companyEn)}
                    </p>
                  </div>
                  <span className="text-xs text-text-tertiary tabular-nums shrink-0">
                    {exp.startDate} — {exp.endDate || t("resume.present")}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                    {localized(exp.description, exp.descriptionEn)}
                  </p>
                )}
                {expLinks.length > 0 && (
                  <div className="flex gap-3 mt-3 overflow-x-auto scrollbar-hide">
                    {expLinks.map((link) => (
                      <LinkPreviewCard key={link.url} link={link} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
