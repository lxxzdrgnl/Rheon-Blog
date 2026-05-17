"use client";

import { useI18n, useLocalized } from "@/i18n/provider";
import { SectionHeading } from "./ExperienceSection";

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
    <section className="page-container py-8">
      <div className="h-px bg-border mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2 md:gap-8">
        <SectionHeading>{t("resume.education")}</SectionHeading>
        <div className="space-y-6">
          {education.map((edu) => (
            <div key={edu.id}>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                <div>
                  <h3 className="font-semibold text-[0.95rem] text-text-primary">
                    {localized(edu.school, edu.schoolEn)}
                  </h3>
                  {(edu.degree || edu.field) && (
                    <p className="text-sm text-text-secondary mt-0.5">
                      {[localized(edu.degree, edu.degreeEn), localized(edu.field, edu.fieldEn)].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-xs text-text-tertiary tabular-nums shrink-0">
                  {edu.startDate} — {edu.endDate || t("resume.present")}
                </span>
              </div>
              {edu.description && (
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  {localized(edu.description, edu.descriptionEn)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
