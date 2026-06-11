"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { useI18n, useLocalized } from "@/i18n/provider";

interface Project {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string;
  descriptionEn: string | null;
  thumbnail: string | null;
  techStack: string;
}

const parseTechs = (raw: string): string[] => {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

interface Skill { name: string; category: string; categoryEn: string | null }

/**
 * 프로젝트 목록 — 홈 Skills 섹션처럼 카테고리별 기술 칩으로 필터.
 */
export function ProjectsExplorer({
  projects,
  skills,
  locale,
}: {
  projects: Project[];
  /** 홈 Skills(기술스택) — 카테고리별 그룹으로 필터 칩 렌더 */
  skills: Skill[];
  locale: string;
}) {
  const { locale: loc } = useI18n();
  const localized = useLocalized();
  const en = loc === "en";
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 홈처럼 카테고리별 그룹 (sortOrder 순서 유지)
  const groups = useMemo(() => {
    const out: { cat: string; items: string[] }[] = [];
    const idx = new Map<string, number>();
    for (const s of skills) {
      const cat = (en ? s.categoryEn || s.category : s.category) || "";
      if (!idx.has(cat)) {
        idx.set(cat, out.length);
        out.push({ cat, items: [] });
      }
      out[idx.get(cat)!].items.push(s.name);
    }
    return out;
  }, [skills, en]);

  const toggle = (t: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });

  const filtered = useMemo(() => {
    if (selected.size === 0) return projects;
    return projects.filter((p) => parseTechs(p.techStack).some((t) => selected.has(t)));
  }, [projects, selected]);

  const activeTechs = [...selected];

  return (
    <div className="space-y-6">
      {groups.length > 0 && (
        <div className="space-y-2.5 animate-fade-in animate-delay-1">
          {groups.map(({ cat, items }) => (
            <div key={cat} className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-text-tertiary w-20 shrink-0">{cat}</span>
              {items.map((t) => {
                const on = selected.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggle(t)}
                    aria-pressed={on}
                    className={`px-2.5 py-0.5 text-sm rounded-full transition-colors duration-150 ${
                      on ? "bg-accent/12 text-accent font-medium" : "text-text-secondary hover:text-accent hover:bg-accent/[0.06]"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          ))}
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="pt-1 text-xs text-accent hover:text-accent/70 transition-colors"
            >
              {localized("필터 초기화", "Clear filters")} · {filtered.length}
              {localized("개", "")}
            </button>
          )}
        </div>
      )}

      {filtered.length > 0 ? (
        <div
          key={activeTechs.slice().sort().join(",") || "all"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in"
        >
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} locale={locale} activeTechs={activeTechs} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-16">
          {en ? "No projects match the selected tech." : "선택한 기술의 프로젝트가 없습니다."}
        </p>
      )}
    </div>
  );
}
