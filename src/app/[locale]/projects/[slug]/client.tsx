"use client";

import { useI18n, useLocalized } from "@/i18n/provider";
import { EYEBROW } from "@/lib/styles";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PostGrid } from "@/components/blog/PostGrid";
import { CategoryOtherPosts } from "@/components/blog/CategoryOtherPosts";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CategorySidebar } from "@/components/blog/CategorySidebar";
import { InProgressBadge } from "@/components/blog/InProgressBadge";
import { parseMembers, githubHandle, type ProjectMember } from "@/lib/members";

interface CatNode { id: number; parentId: number | null; name: string; nameEn: string; slug: string; postCount?: number; children: CatNode[] }
interface RecentPost { id: number; title: string; titleEn: string | null; slug: string; createdAt: string }

interface ProjectLink {
  badge?: string;
  label: string;
  url: string;
}

interface Project {
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  content: string | null;
  contentEn: string | null;
  thumbnail: string | null;
  techStack: string | null;
  link: string | null;
  inProgress: boolean;
  isTeam: boolean;
  members: string | null;
}

interface PostWithCategory {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  thumbnailTextLength?: number | null;
  thumbnailTextLengthEn?: number | null;
  showTitleOnThumbnail?: boolean | null;
  createdAt: string;
  categoryName: string;
  categoryNameEn: string;
  tags?: { name: string; nameEn: string }[];
}

function parseLinks(link: string | null): ProjectLink[] {
  if (!link) return [];
  try {
    const parsed = JSON.parse(link);
    if (Array.isArray(parsed)) return parsed.filter((l: ProjectLink) => l.url?.trim());
    return [];
  } catch {
    return link.trim() ? [{ label: "Link", url: link }] : [];
  }
}

function LinkIcon({ badge, label, className }: { badge?: string; label: string; className?: string }) {
  const b = badge || label.toLowerCase();
  const cls = className || "w-5 h-5";
  if (b === "github" || b.includes("github")) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    );
  }
  if (b === "demo" || b.includes("demo") || b.includes("live") || b.includes("배포")) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    );
  }
  if (b === "docs" || b.includes("docs") || b.includes("문서")) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }
  if (b === "figma" || b.includes("figma")) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 00-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.098-7.509a3.023 3.023 0 00-3.019 3.019 3.023 3.023 0 003.019 3.019h.098a3.023 3.023 0 003.019-3.019 3.023 3.023 0 00-3.019-3.019h-.098z"/>
      </svg>
    );
  }
  if (b === "npm" || b.includes("npm")) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323h13.74v13.04H15.5V8.693h-3.37v9.67H5.13z"/>
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function classify(l: ProjectLink) {
  const b = (l.badge || l.label || "").toLowerCase();
  if (b === "github" || b.includes("github")) return "repo";
  if (b === "demo" || b.includes("demo") || b.includes("live") || b.includes("배포")) return "demo";
  return "other";
}

function GithubMark() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

/** 팀원 한 명의 표시용 값 — isMe면 이름·GitHub를 프로필에서 채운다. */
function resolveMember(m: ProjectMember, me: { name: string; github: string | null }, en: boolean) {
  const name = m.isMe ? me.name : (en && m.nameEn ? m.nameEn : m.name);
  const github = m.isMe ? me.github : m.github ?? null;
  const role = en && m.roleEn ? m.roleEn : m.role;
  return { name, github, role };
}

function TeamTable({
  members,
  me,
  en,
  labelCls,
}: {
  members: ProjectMember[];
  me: { name: string; github: string | null };
  en: boolean;
  labelCls: string;
}) {
  return (
    <div className="mt-8 animate-fade-in animate-delay-1">
      <span className={`${labelCls} ml-0.5 mb-2 block`}>{en ? "Team" : "팀 구성"}</span>

      {/* sm 이상: 표 */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border/40 bg-bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                {en ? "Name" : "이름"}
              </th>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                GitHub
              </th>
              <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                {en ? "Role" : "역할"}
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => {
              const { name, github, role } = resolveMember(m, me, en);
              const handle = githubHandle(github);
              return (
                <tr key={i} className="border-b border-border/20 last:border-b-0 align-top">
                  <td className={`px-4 py-3 whitespace-nowrap font-semibold ${m.isMe ? "text-accent" : "text-text-primary"}`}>
                    {name}
                    {m.isMe && (
                      <span className="ml-1.5 rounded px-1.5 py-0.5 text-[11px] font-bold bg-accent-soft text-accent border border-accent/20">
                        {en ? "Me" : "나"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {handle && github ? (
                      <a
                        href={github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[13px] text-text-secondary hover:text-accent transition-colors"
                      >
                        <GithubMark />
                        {handle}
                      </a>
                    ) : (
                      <span className="text-[13px] text-text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary leading-relaxed">{role}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* sm 미만: 행별 카드 — 가로 스크롤 회피 */}
      <div className="sm:hidden space-y-2">
        {members.map((m, i) => {
          const { name, github, role } = resolveMember(m, me, en);
          const handle = githubHandle(github);
          return (
            <div
              key={i}
              className={`rounded-xl border bg-bg-card p-3.5 ${m.isMe ? "border-accent/40" : "border-border/40"}`}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-semibold text-sm ${m.isMe ? "text-accent" : "text-text-primary"}`}>{name}</span>
                {m.isMe && (
                  <span className="rounded px-1.5 py-0.5 text-[11px] font-bold bg-accent-soft text-accent border border-accent/20">
                    {en ? "Me" : "나"}
                  </span>
                )}
                {handle && github && (
                  <a
                    href={github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[13px] text-text-tertiary hover:text-accent transition-colors"
                  >
                    <GithubMark />
                    {handle}
                  </a>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-text-secondary leading-relaxed">{role}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectDetailClient({
  project,
  me,
  relatedPosts,
  categoryTree,
  categoryCounts,
  recentPosts,
  viewStats,
}: {
  project: Project;
  me: { name: string; github: string | null };
  relatedPosts: PostWithCategory[];
  categoryTree: CatNode[];
  categoryCounts: Record<number, number>;
  recentPosts: RecentPost[];
  viewStats: { total: number; today: number };
}) {
  const { locale } = useI18n();
  const localized = useLocalized();

  const title = localized(project.title, project.titleEn);
  const description = localized(project.description, project.descriptionEn);
  const content = localized(project.content, project.contentEn);
  const techs: string[] = JSON.parse(project.techStack || "[]");
  const links = parseLinks(project.link);
  const members = project.isTeam ? parseMembers(project.members) : [];

  const en = locale === "en";
  const labelCls = `${EYEBROW} text-text-tertiary`;
  const sections = [
    { key: "repo", title: en ? "Repository" : "레포지토리", items: links.filter((l) => classify(l) === "repo") },
    { key: "demo", title: en ? "Demo / Live" : "데모", items: links.filter((l) => classify(l) === "demo") },
    { key: "other", title: en ? "Links" : "링크", items: links.filter((l) => classify(l) === "other") },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="page-container py-10 md:py-16 relative">
      {/* 왼쪽 분류 트리 + 최신글 (xl 이상) */}
      <CategorySidebar tree={categoryTree} counts={categoryCounts} recentPosts={recentPosts} viewStats={viewStats} />
      {/* ── Hero thumbnail ── */}
      {project.thumbnail && (
        <div className="max-w-prose mx-auto mb-10 px-1 sm:px-0 animate-fade-in">
          <div className="relative rounded-2xl overflow-hidden bg-bg-card">
            <img
              src={project.thumbnail}
              alt={title}
              className="w-full object-cover"
            />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.06] pointer-events-none" />
          </div>
        </div>
      )}

      <div className="max-w-prose mx-auto px-1 sm:px-0">
        {/* ── Header ── */}
        <header className="animate-fade-in">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl md:text-[2.5rem] font-bold tracking-tight leading-[1.15]">
              {title}
            </h1>
            {project.inProgress && <InProgressBadge locale={locale} />}
          </div>
          <p className="mt-4 text-base text-text-secondary leading-relaxed">
            {description}
          </p>

          {techs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {techs.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-accent-soft text-accent border border-accent/10"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* ── Links ── */}
        {sections.length > 0 && (
          <div className="mt-8 animate-fade-in animate-delay-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sections.map((section) => (
                <div key={section.key} className={sections.length === 1 ? "sm:col-span-2" : ""}>
                  <span className={`${labelCls} ml-0.5 mb-2 block`}>
                    {section.title}
                  </span>
                  <div className="space-y-1.5">
                    {section.items.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 pl-3 pr-3.5 py-3 rounded-xl bg-bg-card border border-border/40 hover:border-accent/40 hover:shadow-[0_2px_12px_-3px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_2px_12px_-3px_rgba(0,0,0,0.4)] transition-all duration-250"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-elevated group-hover:bg-accent/10 transition-colors duration-250">
                          <span className="text-text-tertiary group-hover:text-accent transition-colors duration-250">
                            <LinkIcon badge={l.badge} label={l.label} />
                          </span>
                        </span>
                        <span className="flex-1 min-w-0 text-sm text-text-secondary group-hover:text-accent truncate transition-colors duration-250">
                          {l.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </span>
                        <svg
                          className="w-3.5 h-3.5 text-text-tertiary group-hover:text-accent opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-250 shrink-0"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Team ── */}
        {members.length > 0 && <TeamTable members={members} me={me} en={en} labelCls={labelCls} />}

        {/* ── Related Posts ── */}
        {relatedPosts.length > 0 && (
          <div className="mt-8 animate-fade-in animate-delay-2">
            <div className="flex items-center gap-3 mb-6">
              <h2 className={`${labelCls} whitespace-nowrap`}>
                {locale === "en" ? "Related Posts" : "관련 포스트"}
              </h2>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <PostGrid posts={relatedPosts} />
          </div>
        )}

        {/* ── Content ── */}
        {content && (
          <>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <article className="mt-6 animate-fade-in animate-delay-2">
              <MarkdownRenderer content={content} />
            </article>
          </>
        )}

        {/* ── 본문 다 읽고 나서 다시 짚어주는 관련 포스트 (위 그리드와 같은 글, 한 줄 목록) ── */}
        {relatedPosts.length > 0 && (
          <div className={`animate-fade-in animate-delay-2 ${content ? "" : "mt-10"}`}>
            {/* 글 끝 — 구분선. 포스트 상세도 카드 위에 같은 선을 그린다(컴포넌트에 딸려오지 않음).
                본문이 없으면 끝낼 글도 없으니 선 대신 여백만 준다. */}
            {content && <div className="h-px bg-border my-8" />}
            <CategoryOtherPosts
              posts={relatedPosts}
              heading={en ? "Related Posts" : "관련 포스트"}
              showMore={false}
            />
          </div>
        )}
      </div>

      {/* 본문(.prose) 헤딩 기반 목차 — 글 상세와 동일하게 오른쪽 fixed */}
      <TableOfContents />
    </div>
  );
}
