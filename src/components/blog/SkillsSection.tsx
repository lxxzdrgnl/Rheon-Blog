"use client";

import { useI18n, useLocalized } from "@/i18n/provider";
import { SectionHeading } from "./ExperienceSection";

interface Skill {
  id: number;
  name: string;
  category: string;
  categoryEn: string | null;
}

export function SkillsSection({ skills }: { skills: Skill[] }) {
  const { t } = useI18n();
  const localized = useLocalized();

  if (skills.length === 0) return null;

  const grouped: Record<string, Skill[]> = {};
  for (const skill of skills) {
    const cat = localized(skill.category, skill.categoryEn);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(skill);
  }

  return (
    <section className="page-container py-8">
      <div className="h-px bg-border mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2 md:gap-8">
        <SectionHeading>{t("resume.skills")}</SectionHeading>
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-4">
              <span className="text-xs font-medium text-text-tertiary w-24 shrink-0">{category}</span>
              <div className="flex flex-wrap gap-1.5">
                {items.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2.5 py-0.5 text-xs bg-bg-elevated/80 rounded-md text-text-primary border border-border/50"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
