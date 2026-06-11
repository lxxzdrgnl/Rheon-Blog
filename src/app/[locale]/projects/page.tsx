import { getPortfolios } from "@/actions/portfolios";
import { getSkills } from "@/actions/resume";
import { ProjectsExplorer } from "@/components/blog/ProjectsExplorer";
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
  const [allProjects, skillsList] = await Promise.all([getPortfolios(), getSkills()]);

  return (
    <div className="page-container py-4 md:py-6 space-y-5 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight animate-fade-in">
        {en ? "Projects" : "프로젝트"}
      </h1>
      {allProjects.length > 0 ? (
        <ProjectsExplorer
          projects={allProjects}
          skills={skillsList.map((s) => ({ name: s.name, category: s.category, categoryEn: s.categoryEn }))}
          locale={locale}
        />
      ) : (
        <p className="text-sm text-text-tertiary text-center py-16">{en ? "No projects yet." : "등록된 프로젝트가 없습니다."}</p>
      )}
    </div>
  );
}
