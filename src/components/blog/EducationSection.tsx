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
    <section className="page-container pb-20">
      <h2 className="text-xl font-bold tracking-tight mb-8">
        <span className="text-accent mr-1.5">/</span>{t("resume.education")}
      </h2>
      <div className="space-y-8">
        {education.map((edu) => (
          <div key={edu.id} className="relative pl-6 border-l-2 border-border hover:border-accent transition-colors">
            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-accent" />
            <h3 className="font-semibold text-text-primary">
              {localized(edu.school, edu.schoolEn)}
            </h3>
            {(edu.degree || edu.field) && (
              <p className="text-sm text-text-secondary mt-0.5">
                {[localized(edu.degree, edu.degreeEn), localized(edu.field, edu.fieldEn)].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="text-xs text-text-tertiary mt-1">
              {edu.startDate} — {edu.endDate || t("resume.present")}
            </p>
            {edu.description && (
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                {localized(edu.description, edu.descriptionEn)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
