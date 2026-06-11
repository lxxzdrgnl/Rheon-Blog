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

/** 프로젝트(포트폴리오) 카드 — /projects 목록과 검색 결과가 공용으로 사용. */
export function ProjectCard({
  project,
  locale,
  highlight,
  snippet,
}: {
  project: ProjectCardItem;
  locale: string;
  highlight?: string;
  /** 제목·설명이 아닌 본문에서 매칭됐을 때 보여줄 스니펫 (검색 결과용) */
  snippet?: string | null;
}) {
  const en = locale === "en";
  const title = en && project.titleEn ? project.titleEn : project.title;
  const description = en && project.descriptionEn ? project.descriptionEn : project.description;
  const techs: string[] = JSON.parse(project.techStack || "[]");

  return (
    <a href={`/${locale}/projects/${project.slug}`} className="group">
      <article className="card-hover rounded-lg border border-border/60 overflow-hidden h-full flex flex-col bg-bg-primary">
        {project.thumbnail ? (
          <div className="aspect-[16/10] overflow-hidden">
            <img src={project.thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-bg-card flex items-center justify-center">
            <h3 className="text-base font-semibold text-center text-text-tertiary">{title.charAt(0)}</h3>
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-semibold text-sm"><Highlight text={title} query={highlight} /></h3>
          <p className="text-sm text-text-secondary mt-2 flex-1 leading-relaxed"><Highlight text={description} query={highlight} /></p>
          {snippet && (
            <p className="text-[13px] text-text-tertiary mt-2 leading-relaxed line-clamp-2">
              <Highlight text={snippet} query={highlight} />
            </p>
          )}
          {techs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {techs.map((tech) => (
                <span key={tech} className="px-2 py-0.5 text-xs bg-bg-elevated rounded text-text-secondary font-medium">{tech}</span>
              ))}
            </div>
          )}
        </div>
      </article>
    </a>
  );
}
