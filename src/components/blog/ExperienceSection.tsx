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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold tracking-[0.25em] uppercase text-text-tertiary mb-5">
      {children}
    </h2>
  );
}

export { SectionHeading };

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
          {experiences.map((exp) => (
            <div key={exp.id} className="group">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
