import { Highlight } from "@/components/ui/Highlight";

interface ProjectCardItem {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string;
  descriptionEn: string | null;
  thumbnail: string | null;
  techStack: string; // JSON array
}

/**
 * 프로젝트(포트폴리오) 카드 — /projects 목록과 검색 결과 공용.
 * 포스트와 달리 묵직한 테두리 카드(card-hover lift). activeTechs는 필터 매칭 기술 강조용.
 */
export function ProjectCard({
  project,
  locale,
  highlight,
  snippet,
  activeTechs,
}: {
  project: ProjectCardItem;
  locale: string;
  highlight?: string;
  /** 제목·설명이 아닌 본문에서 매칭됐을 때 보여줄 스니펫 (검색 결과용) */
  snippet?: string | null;
  /** 필터로 선택된 기술 — 매칭 칩을 accent로 강조하고 앞으로 정렬 */
  activeTechs?: string[];
}) {
  const en = locale === "en";
  const title = en && project.titleEn ? project.titleEn : project.title;
  const description = en && project.descriptionEn ? project.descriptionEn : project.description;
  let techs: string[] = [];
  try { techs = JSON.parse(project.techStack || "[]"); } catch { techs = []; }

  const active = new Set(activeTechs);
  if (active.size > 0) {
    techs = [...techs].sort((a, b) => (active.has(b) ? 1 : 0) - (active.has(a) ? 1 : 0));
  }

  return (
    <a href={`/${locale}/projects/${project.slug}`} className="group block h-full">
      <article className="card-hover h-full flex flex-col rounded-lg border border-border bg-bg-primary overflow-hidden">
        {/* Cover */}
        {project.thumbnail ? (
          <div className="aspect-[16/10] overflow-hidden border-b border-border">
            <img src={project.thumbnail} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-[16/10] flex items-center justify-center border-b border-border bg-bg-elevated">
            <span className="text-6xl font-black text-text-tertiary/25 select-none">
              {title.charAt(0)}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col flex-1 p-5">
          <h3 className="text-base font-bold tracking-tight leading-snug text-text-primary group-hover:text-accent transition-colors line-clamp-2">
            <Highlight text={title} query={highlight} />
          </h3>

          {description && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed flex-1">
              <Highlight text={description} query={highlight} />
            </p>
          )}

          {snippet && (
            <p className="mt-2 text-[13px] text-text-tertiary leading-relaxed line-clamp-2">
              <Highlight text={snippet} query={highlight} />
            </p>
          )}

          {techs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {techs.map((tech) => (
                <span
                  key={tech}
                  className={`px-2 py-0.5 text-xs rounded-md font-medium ${
                    active.has(tech) ? "bg-accent/12 text-accent" : "bg-bg-elevated text-text-secondary"
                  }`}
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </a>
  );
}
