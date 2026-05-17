"use client";

import { useI18n, useLocalized } from "@/i18n/provider";

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
    <section className="page-container pb-20">
      <h2 className="text-xl font-bold tracking-tight mb-8">
        <span className="text-accent mr-1.5">/</span>{t("resume.skills")}
      </h2>
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-text-secondary mb-3">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((skill) => (
                <span
                  key={skill.id}
                  className="px-3 py-1.5 text-sm bg-bg-elevated rounded-lg text-text-primary border border-border/60"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
