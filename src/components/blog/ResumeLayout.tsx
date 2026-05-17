"use client";

import { useState, useEffect } from "react";
import { useI18n, useLocalized } from "@/i18n/provider";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PostCard } from "./PostCard";
import Link from "next/link";

// ── Types ──

interface SocialLink { id: number; platform: string; url: string }
interface Experience { id: number; company: string; companyEn: string | null; role: string; roleEn: string | null; description: string | null; descriptionEn: string | null; startDate: string; endDate: string | null; links: string | null }
interface Education { id: number; school: string; schoolEn: string | null; degree: string | null; degreeEn: string | null; field: string | null; fieldEn: string | null; description: string | null; descriptionEn: string | null; startDate: string; endDate: string | null }
interface Skill { id: number; name: string; category: string; categoryEn: string | null }
interface Portfolio { id: number; title: string; titleEn: string | null; slug: string; description: string; descriptionEn: string | null; techStack: string; link: string | null; icon: string | null; thumbnail: string | null }
interface Post { id: number; title: string; titleEn: string | null; slug: string; thumbnail: string | null; createdAt: string; categoryName: string; categoryNameEn: string; tags?: { name: string; nameEn: string }[] }
interface ExperienceLink { label: string; url: string }

// ── Icons ──

const ICONS: Record<string, string> = {
  github: "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12.01 12.01 0 0024 12c0-6.63-5.37-12-12-12z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  email: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
};

// ── Helpers ──

interface PortfolioLink { badge?: string; label: string; url: string }

function parsePortfolioLinks(link: string | null): PortfolioLink[] {
  if (!link) return [];
  try {
    const parsed = JSON.parse(link);
    if (Array.isArray(parsed)) return parsed.filter((l: PortfolioLink) => l.url?.trim());
    return [];
  } catch {
    return link.trim() ? [{ label: "Link", url: link }] : [];
  }
}

// ── Sub-components ──

function ProjectIcon({ dbIcon, demoUrl, fallbackChar }: { dbIcon: string | null; demoUrl: string | null; fallbackChar: string }) {
  const [icon, setIcon] = useState<string | null>(dbIcon || null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (dbIcon || !demoUrl) return;
    fetch(`/api/favicon?url=${encodeURIComponent(demoUrl)}`)
      .then((r) => r.json())
      .then((d) => { if (d.icon) setIcon(d.icon); })
      .catch(() => {});
  }, [dbIcon, demoUrl]);

  if (icon && !failed) {
    return <img src={icon} alt="" className="w-5 h-5 rounded shrink-0 object-contain" onError={() => setFailed(true)} />;
  }
  return (
    <span className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-[10px] font-bold bg-accent/10 dark:bg-accent/15 text-accent">
      {fallbackChar}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-text-tertiary pt-0.5">
      {children}
    </div>
  );
}

function LinkPreview({ link }: { link: ExperienceLink }) {
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/og?url=${encodeURIComponent(link.url)}`)
      .then((r) => r.json())
      .then((d) => { if (d.image) setImg(d.image); })
      .catch(() => {});
  }, [link.url]);

  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className="group block w-[120px] shrink-0">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-bg-elevated border border-border/40 group-hover:border-accent/40 transition-colors">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" onError={() => setImg(null)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-tertiary/50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
        )}
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-text-tertiary mt-1 line-clamp-1 group-hover:text-accent transition-colors leading-tight">{link.label}</p>
    </a>
  );
}

// ── Main Layout ──

interface ResumeLayoutProps {
  settings: Record<string, unknown>;
  socialLinks: SocialLink[];
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  portfolios: Portfolio[];
  posts: Post[];
}

export function ResumeLayout({ settings, socialLinks, experiences, education, skills, portfolios, posts }: ResumeLayoutProps) {
  const { t } = useI18n();
  const localized = useLocalized();

  const s = (key: string) => (settings[key] as string) || "";

  const displayName = localized(s("resume_name"), s("resume_name_en"));
  const displayTitle = localized(s("resume_title"), s("resume_title_en"));
  const displayTagline = localized(s("resume_tagline"), s("resume_tagline_en"));
  const displayAbout = localized(s("resume_about"), s("resume_about_en"));
  const profileImage = s("resume_profile_image") || null;

  // Group skills by category
  const skillGroups: Record<string, Skill[]> = {};
  for (const skill of skills) {
    const cat = localized(skill.category, skill.categoryEn);
    if (!skillGroups[cat]) skillGroups[cat] = [];
    skillGroups[cat].push(skill);
  }

  return (
    <div className="page-container pt-12 pb-20 md:pt-20">
      {/* ━━━ HEADER ━━━ */}
      <header className="animate-fade-in">
        <div className="flex items-start gap-5 md:gap-8">
          {profileImage && (
            <div className="shrink-0">
              <img
                src={profileImage}
                alt={displayName}
                className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover ring-1 ring-border/60"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="font-serif text-2xl md:text-4xl font-bold tracking-tight leading-none">
              {displayName}
            </h1>
            {displayTitle && (
              <p className="text-sm md:text-base text-text-secondary mt-1.5">{displayTitle}</p>
            )}
            {/* Social links inline */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4 mt-3">
                {socialLinks.map((link) => {
                  const icon = ICONS[link.platform.toLowerCase()];
                  const href = link.platform.toLowerCase() === "email" ? `mailto:${link.url}` : link.url;
                  return (
                    <a key={link.id} href={href} target={link.platform.toLowerCase() === "email" ? undefined : "_blank"} rel="noopener noreferrer" className="text-text-tertiary hover:text-accent transition-colors" title={link.platform}>
                      {icon ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d={icon} /></svg>
                      ) : (
                        <span className="text-xs">{link.platform}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ━━━ ABOUT ━━━ */}
      {displayAbout && (
        <section className="mt-8 animate-fade-in animate-delay-1">
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">{displayAbout}</p>
        </section>
      )}

      {/* ━━━ RESUME GRID ━━━ */}
      <div className="mt-10 space-y-0 divide-y divide-border">

        {/* ── Experience ── */}
        {experiences.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 md:gap-8 py-8 first:pt-0">
            <SectionLabel>{t("resume.experience")}</SectionLabel>
            <div className="space-y-7">
              {experiences.map((exp) => {
                const expLinks: ExperienceLink[] = exp.links ? JSON.parse(exp.links) : [];
                return (
                  <div key={exp.id}>
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-text-primary leading-snug">
                          {localized(exp.role, exp.roleEn)}
                        </h3>
                        <p className="text-sm text-accent">{localized(exp.company, exp.companyEn)}</p>
                      </div>
                      <span className="text-xs text-text-tertiary tabular-nums mt-0.5 sm:mt-0 shrink-0">
                        {exp.startDate} — {exp.endDate || t("resume.present")}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{localized(exp.description, exp.descriptionEn)}</p>
                    )}
                    {expLinks.length > 0 && (
                      <div className="flex gap-2.5 mt-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
                        {expLinks.map((link) => <LinkPreview key={link.url} link={link} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Education ── */}
        {education.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 md:gap-8 py-8">
            <SectionLabel>{t("resume.education")}</SectionLabel>
            <div className="space-y-5">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary leading-snug">{localized(edu.school, edu.schoolEn)}</h3>
                      {(edu.degree || edu.field) && (
                        <p className="text-sm text-text-secondary">{[localized(edu.degree, edu.degreeEn), localized(edu.field, edu.fieldEn)].filter(Boolean).join(", ")}</p>
                      )}
                    </div>
                    <span className="text-xs text-text-tertiary tabular-nums mt-0.5 sm:mt-0 shrink-0">
                      {edu.startDate} — {edu.endDate || t("resume.present")}
                    </span>
                  </div>
                  {edu.description && (
                    <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{localized(edu.description, edu.descriptionEn)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Skills ── */}
        {skills.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 md:gap-8 py-8">
            <SectionLabel>{t("resume.skills")}</SectionLabel>
            <div className="space-y-3">
              {Object.entries(skillGroups).map(([cat, items]) => (
                <div key={cat} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                  <span className="text-xs text-text-tertiary w-20 shrink-0">{cat}</span>
                  {items.map((s, i) => (
                    <span key={s.id} className="text-sm text-text-primary">
                      {s.name}{i < items.length - 1 && <span className="text-text-tertiary ml-1.5 mr-0.5">·</span>}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Projects ── */}
        {portfolios.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 md:gap-8 py-8">
            <SectionLabel>{t("resume.projects")}</SectionLabel>
            <div className="space-y-1.5">
              {portfolios.map((item) => {
                const techs: string[] = JSON.parse(item.techStack || "[]");
                const links = parsePortfolioLinks(item.link);
                const githubLink = links.find((l) => {
                  const b = (l.badge || l.label || "").toLowerCase();
                  return b === "github" || b.includes("github");
                });
                const demoLink = links.find((l) => {
                  const b = (l.badge || l.label || "").toLowerCase();
                  return b === "demo" || b.includes("demo") || b.includes("live") || b.includes("배포");
                });
                const title = localized(item.title, item.titleEn);
                return (
                  <div key={item.id} className="group flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-bg-card/60 transition-colors">
                    <Link href={`/projects/${item.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <ProjectIcon dbIcon={item.icon} demoUrl={demoLink?.url ?? null} fallbackChar={title.charAt(0).toUpperCase()} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors leading-snug truncate">
                          {title}
                        </h3>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{localized(item.description, item.descriptionEn)}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {githubLink && (
                        <a
                          href={githubLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-card transition-colors"
                          title="GitHub"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d={ICONS.github} />
                          </svg>
                        </a>
                      )}
                      {demoLink && (
                        <a
                          href={demoLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-accent hover:bg-accent/8 transition-colors"
                          title="Live Demo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      )}
                      {techs.length > 0 && (
                        <div className="hidden sm:flex flex-wrap gap-1 shrink-0 max-w-[200px] justify-end ml-1">
                          {techs.slice(0, 3).map((tech) => (
                            <span key={tech} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent/8 dark:bg-accent/15 text-accent">
                              {tech}
                            </span>
                          ))}
                          {techs.length > 3 && <span className="text-[10px] text-text-tertiary">+{techs.length - 3}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ━━━ RECENT POSTS ━━━ */}
      {posts.length > 0 && (
        <section className="mt-12">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-text-tertiary">{t("resume.recentPosts")}</h2>
            <Link href="/posts" className="text-[11px] font-medium text-text-tertiary hover:text-accent transition-colors tracking-wide uppercase">
              {t("hero.allPosts")} →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.slice(0, 6).map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
