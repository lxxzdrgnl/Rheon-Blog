import { getPortfolios } from "@/actions/portfolios";
import { ProjectCard } from "@/components/blog/ProjectCard";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

interface Props { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ko") as "en" | "ko";
  const title = loc === "en" ? "Projects" : "프로젝트";
  const description = loc === "en" ? "Projects and portfolio" : "프로젝트와 포트폴리오";
  return pageMetadata({ title, description, path: "/projects", locale: loc, type: "website" });
}

export default async function ProjectsListPage({ params }: Props) {
  const { locale } = await params;
  const en = locale === "en";
  const allProjects = await getPortfolios();

  return (
    <div className="page-container py-4 md:py-10">
      <h1 className="text-2xl font-bold tracking-tight mb-10 animate-fade-in">Projects</h1>
      {allProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in animate-delay-1">
          {allProjects.map((item) => (
            <ProjectCard key={item.id} project={item} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-16">{en ? "No projects yet." : "등록된 프로젝트가 없습니다."}</p>
      )}
    </div>
  );
}
