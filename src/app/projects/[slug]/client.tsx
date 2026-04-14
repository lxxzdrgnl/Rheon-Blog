"use client";

import { useI18n, useLocalized } from "@/i18n/provider";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PostGrid } from "@/components/blog/PostGrid";

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
}

interface PostWithCategory {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  categoryName: string;
  categoryNameEn: string;
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

export function ProjectDetailClient({ project, relatedPosts }: { project: Project; relatedPosts: PostWithCategory[] }) {
  const { locale } = useI18n();
  const localized = useLocalized();

  const title = localized(project.title, project.titleEn);
  const description = localized(project.description, project.descriptionEn);
  const content = localized(project.content, project.contentEn);
  const techs: string[] = JSON.parse(project.techStack || "[]");
  const links = parseLinks(project.link);

  const sections = [
    { key: "repo", title: "Repository", items: links.filter((l) => classify(l) === "repo") },
    { key: "demo", title: "Demo / Live", items: links.filter((l) => classify(l) === "demo") },
    { key: "other", title: "Links", items: links.filter((l) => classify(l) === "other") },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="page-container py-10 md:py-16">
      {/* ── Hero thumbnail ── */}
      {project.thumbnail && (
        <div className="max-w-prose mx-auto mb-10 animate-fade-in">
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

      <div className="max-w-prose mx-auto">
        {/* ── Header ── */}
        <header className="animate-fade-in">
          <h1 className="font-serif text-3xl md:text-[2.5rem] font-bold tracking-tight leading-[1.15]">
            {title}
          </h1>
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
                  <span className="text-[11px] text-text-tertiary uppercase tracking-widest font-semibold ml-0.5 mb-2 block">
                    {section.title}
                  </span>
                  <div className="space-y-1.5">
                    {section.items.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 pl-3 pr-3.5 py-3 rounded-xl bg-bg-card border border-border/40 hover:border-accent/40 hover:shadow-[0_2px_12px_-3px_rgba(42,157,110,0.15)] dark:hover:shadow-[0_2px_12px_-3px_rgba(94,186,151,0.1)] transition-all duration-250"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-elevated group-hover:bg-accent/10 transition-colors duration-250">
                          <span className="text-text-tertiary group-hover:text-accent transition-colors duration-250">
                            <LinkIcon badge={l.badge} label={l.label} />
                          </span>
                        </span>
                        <span className="flex-1 min-w-0 text-sm text-text-secondary group-hover:text-text-primary truncate transition-colors duration-250">
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

        {/* ── Related Posts ── */}
        {relatedPosts.length > 0 && (
          <div className="mt-14 animate-fade-in animate-delay-2">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-text-tertiary whitespace-nowrap">
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
            <div className="mt-14 flex items-center gap-3">
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <article className="mt-10 animate-fade-in animate-delay-2">
              <MarkdownRenderer content={content} />
            </article>
          </>
        )}
      </div>
    </div>
  );
}
