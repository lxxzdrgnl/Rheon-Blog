"use client";

import { useI18n, useLocalized } from "@/i18n/provider";

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
}

export function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  const { t } = useI18n();
  const localized = useLocalized();

  if (experiences.length === 0) return null;

  return (
    <section className="page-container pb-10">
      <h2 className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-text-tertiary mb-6">
        <div className="h-px flex-1 max-w-8 bg-border" />
        {t("resume.experience")}
        <div className="h-px flex-1 bg-border" />
      </h2>
      <div className="space-y-6">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className="group relative p-5 rounded-xl border border-border/40 hover:border-accent/30 bg-bg-card/30 hover:bg-bg-card/60 transition-all duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {localized(exp.role, exp.roleEn)}
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  {localized(exp.company, exp.companyEn)}
                </p>
              </div>
              <span className="text-xs text-text-tertiary font-mono whitespace-nowrap mt-1 sm:mt-0.5">
                {exp.startDate} — {exp.endDate || t("resume.present")}
              </span>
            </div>
            {exp.description && (
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                {localized(exp.description, exp.descriptionEn)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
