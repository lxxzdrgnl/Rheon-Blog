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
    <section className="page-container pb-12">
      <h2 className="text-lg font-bold tracking-tight mb-5">
        <span className="text-accent mr-1.5">/</span>{t("resume.experience")}
      </h2>
      <div className="space-y-8">
        {experiences.map((exp) => (
          <div key={exp.id} className="relative pl-6 border-l-2 border-border hover:border-accent transition-colors">
            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-accent" />
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
              <h3 className="font-semibold text-text-primary">
                {localized(exp.role, exp.roleEn)}
              </h3>
              <span className="text-sm text-text-secondary">
                {localized(exp.company, exp.companyEn)}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              {exp.startDate} — {exp.endDate || t("resume.present")}
            </p>
            {exp.description && (
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                {localized(exp.description, exp.descriptionEn)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
