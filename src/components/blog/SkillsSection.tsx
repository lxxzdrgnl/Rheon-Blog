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
    <section className="page-container pb-10">
      <h2 className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-text-tertiary mb-6">
        <div className="h-px flex-1 max-w-8 bg-border" />
        {t("resume.skills")}
        <div className="h-px flex-1 bg-border" />
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-2.5">
            <h3 className="text-xs font-semibold text-text-tertiary tracking-wide uppercase">{category}</h3>
            <div className="flex flex-wrap gap-1.5">
              {items.map((skill) => (
                <span
                  key={skill.id}
                  className="px-2.5 py-1 text-xs font-medium bg-bg-elevated rounded-md text-text-primary border border-border/50 hover:border-accent/40 hover:text-accent transition-colors cursor-default"
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
