import { getPortfolios } from "@/actions/portfolios";
import { PortfolioSection } from "@/components/blog/PortfolioSection";

export default async function ProjectsListPage() {
  const allProjects = await getPortfolios();

  return (
    <div className="page-container py-16">
      <h1 className="text-2xl font-bold tracking-tight mb-10">Projects</h1>
      {allProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allProjects.map((item) => {
            const techs: string[] = JSON.parse(item.techStack || "[]");
            return (
              <a key={item.id} href={`/projects/${item.slug}`} className="group">
                <article className="card-hover rounded-lg border border-border/60 overflow-hidden h-full flex flex-col bg-bg-primary">
                  {item.thumbnail ? (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-bg-card flex items-center justify-center">
                      <h3 className="text-base font-semibold text-center text-text-tertiary">{item.title.charAt(0)}</h3>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-sm text-text-secondary mt-2 flex-1 leading-relaxed">{item.description}</p>
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
        <p className="text-sm text-text-tertiary text-center py-16">등록된 프로젝트가 없습니다.</p>
      )}
    </div>
  );
}
