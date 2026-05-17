"use client";

import { useI18n, useLocalized } from "@/i18n/provider";

interface Education {
  id: number;
  school: string;
  schoolEn: string | null;
  degree: string | null;
  degreeEn: string | null;
  field: string | null;
  fieldEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  startDate: string;
  endDate: string | null;
}

export function EducationSection({ education }: { education: Education[] }) {
  const { t } = useI18n();
  const localized = useLocalized();

  if (education.length === 0) return null;

  return (
    <section className="page-container pb-10">
      <h2 className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-text-tertiary mb-6">
        <div className="h-px flex-1 max-w-8 bg-border" />
        {t("resume.education")}
        <div className="h-px flex-1 bg-border" />
      </h2>
      <div className="space-y-6">
        {education.map((edu) => (
          <div
            key={edu.id}
            className="group relative p-5 rounded-xl border border-border/40 hover:border-accent/30 bg-bg-card/30 hover:bg-bg-card/60 transition-all duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {localized(edu.school, edu.schoolEn)}
                </h3>
                {(edu.degree || edu.field) && (
                  <p className="text-sm text-text-secondary mt-0.5">
                    {[localized(edu.degree, edu.degreeEn), localized(edu.field, edu.fieldEn)].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <span className="text-xs text-text-tertiary font-mono whitespace-nowrap mt-1 sm:mt-0.5">
                {edu.startDate} — {edu.endDate || t("resume.present")}
              </span>
            </div>
            {edu.description && (
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                {localized(edu.description, edu.descriptionEn)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
