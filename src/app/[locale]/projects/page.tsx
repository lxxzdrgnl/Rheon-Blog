import { getPortfolios } from "@/actions/portfolios";
import { PortfolioSection } from "@/components/blog/PortfolioSection";
import type { Metadata } from "next";
import { alternates, socialMeta } from "@/lib/seo";

interface Props { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const title = loc === "en" ? "Projects" : "프로젝트";
  const description = loc === "en" ? "Projects and portfolio" : "프로젝트와 포트폴리오";
  return {
    title,
    description,
    alternates: alternates("/projects", loc),
    ...socialMeta({ title, description, path: "/projects", locale: loc, type: "website" }),
  };
}

export default async function ProjectsListPage({ params }: Props) {
  const { locale } = await params;
  const en = locale === "en";
  const allProjects = await getPortfolios();

  return (
    <div className="page-container py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-10">Projects</h1>
      {allProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allProjects.map((item) => {
            const techs: string[] = JSON.parse(item.techStack || "[]");
            const title = en && item.titleEn ? item.titleEn : item.title;
            const description = en && item.descriptionEn ? item.descriptionEn : item.description;
            return (
              <a key={item.id} href={`/${locale}/projects/${item.slug}`} className="group">
                <article className="card-hover rounded-lg border border-border/60 overflow-hidden h-full flex flex-col bg-bg-primary">
                  {item.thumbnail ? (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={item.thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-bg-card flex items-center justify-center">
                      <h3 className="text-base font-semibold text-center text-text-tertiary">{title.charAt(0)}</h3>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-sm text-text-secondary mt-2 flex-1 leading-relaxed">{description}</p>
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
          })}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-16">{en ? "No projects yet." : "등록된 프로젝트가 없습니다."}</p>
      )}
    </div>
  );
}
