"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useI18n, useLocalized } from "@/i18n/provider";
import { EYEBROW, EASE_OUT, DURATION_BASE, DURATION_SLOW } from "@/lib/styles";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PostCard } from "./PostCard";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { SOCIAL_ICONS } from "@/lib/socialIcons";
import { InProgressBadge } from "@/components/blog/InProgressBadge";

// ── Types ──

interface SocialLink { id: number; platform: string; url: string }
interface Experience { id: number; company: string; companyEn: string | null; role: string; roleEn: string | null; description: string | null; descriptionEn: string | null; startDate: string; endDate: string | null; links: string | null }
interface Activity { id: number; title: string; titleEn: string | null; organization: string; organizationEn: string | null; date: string; description: string | null; descriptionEn: string | null; link: string | null }
interface Education { id: number; school: string; schoolEn: string | null; degree: string | null; degreeEn: string | null; field: string | null; fieldEn: string | null; description: string | null; descriptionEn: string | null; startDate: string; endDate: string | null }
interface Skill { id: number; name: string; category: string; categoryEn: string | null }
interface Portfolio { id: number; title: string; titleEn: string | null; slug: string; description: string; descriptionEn: string | null; techStack: string; link: string | null; icon: string | null; thumbnail: string | null; inProgress?: boolean }
interface Post { id: number; title: string; titleEn: string | null; slug: string; thumbnail: string | null; createdAt: string; categoryName: string; categoryNameEn: string; tags?: { name: string; nameEn: string }[] }
interface ExperienceLink { label: string; url: string }

// ── Icons ──

const ICONS = SOCIAL_ICONS;

// 칩을 연타해도 진행 중인 이동을 현재 위치·속도에서 이어받게 스프링으로. 감쇠 1.0(오버슈트 없음).
const LIST_SPRING = { type: "spring", bounce: 0, duration: DURATION_SLOW } as const;

// ── Helpers ──

interface PortfolioLink { badge?: string; label: string; url: string }

function parseTechs(raw: string): string[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

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

// 기술 필터를 토글하면 행이 언마운트→재마운트된다. 캐시가 없으면 그때마다 파비콘을
// 다시 받아 아이콘이 fallback 글자로 깜빡인다. 모듈 레벨에 담아 재마운트를 무료로 만든다.
const faviconCache = new Map<string, string | null>();

function ProjectIcon({ dbIcon, demoUrl, fallbackChar }: { dbIcon: string | null; demoUrl: string | null; fallbackChar: string }) {
  const [icon, setIcon] = useState<string | null>(dbIcon || (demoUrl ? faviconCache.get(demoUrl) ?? null : null));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (dbIcon || !demoUrl || faviconCache.has(demoUrl)) return;
    fetch(`/api/favicon?url=${encodeURIComponent(demoUrl)}`)
      .then((r) => r.json())
      .then((d) => {
        faviconCache.set(demoUrl, d.icon ?? null);
        if (d.icon) setIcon(d.icon);
      })
      .catch(() => {});
  }, [dbIcon, demoUrl]);

  if (icon && !failed) {
    return <img src={icon} alt="" className="w-5 h-5 rounded shrink-0 object-contain" onError={() => setFailed(true)} />;
  }
  return (
    <span className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-[11px] font-bold bg-accent/10 dark:bg-accent/15 text-accent">
      {fallbackChar}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${EYEBROW} text-text-tertiary pt-0.5`}>
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
      <p className="text-[11px] text-text-tertiary mt-1 line-clamp-1 group-hover:text-accent transition-colors leading-tight">{link.label}</p>
    </a>
  );
}

// ── Main Layout ──

interface ResumeLayoutProps {
  settings: Record<string, unknown>;
  socialLinks: SocialLink[];
  experiences: Experience[];
  activities: Activity[];
  education: Education[];
  skills: Skill[];
  portfolios: Portfolio[];
  posts: Post[];
}

export function ResumeLayout({ settings, socialLinks, experiences, activities, education, skills, portfolios, posts }: ResumeLayoutProps) {
  const { t, locale } = useI18n();
  const localized = useLocalized();
  const reduceMotion = useReducedMotion();

  const s = (key: string) => (settings[key] as string) || "";

  const displayName = localized(s("resume_name"), s("resume_name_en"));
  const displayTitle = localized(s("resume_title"), s("resume_title_en"));
  const displayTagline = localized(s("resume_tagline"), s("resume_tagline_en"));
  const displayAbout = localized(s("resume_about"), s("resume_about_en"));
  const profileImage = s("resume_profile_image") || null;

  // 현재 언어 PDF 우선, 없으면 반대 언어로 폴백. 둘 다 없으면 버튼을 숨긴다.
  const pdfKo = s("resume_pdf_ko");
  const pdfEn = s("resume_pdf_en");
  const resumePdfUrl = (locale === "en" ? pdfEn || pdfKo : pdfKo || pdfEn) || null;

  // 프로필 사진을 오른쪽 텍스트 칸 높이에 맞춘 정사각형으로(겹침 없이). 측정 후 px 지정.
  const textColRef = useRef<HTMLDivElement>(null);
  const [photoSize, setPhotoSize] = useState<number | null>(null);
  useEffect(() => {
    const el = textColRef.current;
    if (!el) return;
    const update = () => setPhotoSize(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Group skills by category
  const skillGroups: Record<string, Skill[]> = {};
  for (const skill of skills) {
    const cat = localized(skill.category, skill.categoryEn);
    if (!skillGroups[cat]) skillGroups[cat] = [];
    skillGroups[cat].push(skill);
  }

  // ── Tech-stack filter ──
  // 기술 스택 버튼 토글 → 선택된 기술이 들어간 프로젝트만 표시. 아무것도 없으면 전체.
  const [selectedTechs, setSelectedTechs] = useState<Set<string>>(new Set());
  const toggleTech = (name: string) =>
    setSelectedTechs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  // techStack은 JSON 문자열이라 파싱이 싸지 않다. 칩을 누를 때마다 전부 다시 파싱하지 않도록 한 번만.
  const techsById = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const p of portfolios) m.set(p.id, parseTechs(p.techStack));
    return m;
  }, [portfolios]);

  const filteredPortfolios = useMemo(
    () =>
      selectedTechs.size === 0
        ? portfolios
        : portfolios.filter((p) => (techsById.get(p.id) ?? []).some((tch) => selectedTechs.has(tch))),
    [portfolios, techsById, selectedTechs],
  );

  return (
    <div className="page-container pt-8 pb-6 md:pt-12">
      {/* ━━━ HEADER ━━━ */}
      <header className="animate-fade-in">
        <div className="flex items-start gap-4 md:gap-6">
          {profileImage && (
            <img
              src={profileImage}
              alt={displayName}
              style={photoSize ? { width: photoSize, height: photoSize } : undefined}
              className="shrink-0 w-28 h-28 object-cover rounded-2xl ring-1 ring-border/60"
            />
          )}
          <div ref={textColRef} className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-none">
              {displayName}
            </h1>
            {displayTitle && (
              <p className="text-sm md:text-base text-text-secondary mt-1.5">{displayTitle}</p>
            )}
            {/* Social links inline */}
            {(socialLinks.length > 0 || resumePdfUrl) && (
              <div className="mt-3 space-y-2">
                {/* 아이콘 링크 (이메일 제외) — 한 줄 */}
                {socialLinks.some((l) => l.platform.toLowerCase() !== "email") && (
                  <div className="flex items-center gap-4">
                    {socialLinks
                      .filter((l) => l.platform.toLowerCase() !== "email")
                      .map((link) => {
                        const icon = ICONS[link.platform.toLowerCase()];
                        return (
                          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-accent transition-colors" title={link.platform}>
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
                {/* 이메일 — 다른 줄에 주소 텍스트 */}
                {socialLinks
                  .filter((l) => l.platform.toLowerCase() === "email")
                  .map((link) => (
                    <a key={link.id} href={`mailto:${link.url}`} className="block text-sm text-text-tertiary hover:text-accent transition-colors">
                      {link.url}
                    </a>
                  ))}
                {resumePdfUrl && (
                  <a
                    href={resumePdfUrl}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-sm text-text-secondary hover:text-accent hover:border-accent/50 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                    {t("resume.downloadCv")}
                  </a>
                )}
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

        {/* ── Skills ── */}
        {skills.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 md:gap-8 py-8 first:pt-0">
            <SectionLabel>{t("resume.skills")}</SectionLabel>
            <div className="space-y-3">
              {Object.entries(skillGroups).map(([cat, items]) => (
                <div key={cat} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-text-tertiary w-20 shrink-0">{cat}</span>
                  {items.map((sk) => {
                    const active = selectedTechs.has(sk.name);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => toggleTech(sk.name)}
                        aria-pressed={active}
                        className={`px-2.5 py-0.5 text-sm rounded-full transition-colors duration-150 ${
                          active
                            ? "bg-accent/12 text-accent font-medium"
                            : "text-text-secondary hover:text-accent hover:bg-accent/[0.06]"
                        }`}
                      >
                        {sk.name}
                      </button>
                    );
                  })}
                </div>
              ))}
              {/* height 애니메이션 대신 grid-template-rows 0fr↔1fr로 아코디언 구현 (컴포지터 친화, 연타 시 자연스러운 중단·역전) */}
              <div
                className={`grid ${reduceMotion ? "" : "transition-[grid-template-rows] duration-300 ease-out"} ${
                  selectedTechs.size > 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden !mt-0" aria-hidden={selectedTechs.size === 0}>
                  <button
                    type="button"
                    onClick={() => setSelectedTechs(new Set())}
                    tabIndex={selectedTechs.size > 0 ? 0 : -1}
                    className="pt-3 text-xs text-accent hover:text-accent/70 transition-colors"
                  >
                    {localized("필터 초기화", "Clear filters")} · {filteredPortfolios.length}{localized("개", "")}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Projects ── */}
        {portfolios.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 md:gap-8 py-8">
            <SectionLabel>{t("resume.projects")}</SectionLabel>
            {/* 컨테이너에는 layout을 걸지 않는다 — 실제 높이는 어차피 즉시 바뀌어 아래 섹션이 따라 올라가고,
                컨테이너 scale은 눈에 보이는 배경도 없이 자식마다 역-스케일 보정만 유발한다. */}
            <div className="space-y-1.5">
              <AnimatePresence initial={false} mode="popLayout">
                {filteredPortfolios.length === 0 && (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
                    className="text-sm text-text-tertiary py-2"
                  >
                    {localized("선택한 기술의 프로젝트가 없어요.", "No projects match the selected tech.")}
                  </motion.p>
                )}
                {filteredPortfolios.map((item) => {
                const techsRaw = techsById.get(item.id) ?? [];
                const techs =
                  selectedTechs.size > 0
                    ? [...techsRaw].sort(
                        (a, b) => (selectedTechs.has(b) ? 1 : 0) - (selectedTechs.has(a) ? 1 : 0),
                      )
                    : techsRaw;
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
                  <motion.div
                    key={item.id}
                    // 행은 높이가 고정이라 위치만 FLIP하면 된다. 전체 layout은 크기까지 애니메이션해서
                    // 자식 텍스트·칩에 스케일 왜곡을 만든다.
                    layout={reduceMotion ? false : "position"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      layout: LIST_SPRING,
                      opacity: { duration: DURATION_BASE, ease: EASE_OUT },
                    }}
                    className="group flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-bg-card/60 transition-colors"
                  >
                    <Link href={`/projects/${item.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <ProjectIcon dbIcon={item.icon} demoUrl={demoLink?.url ?? null} fallbackChar={title.charAt(0).toUpperCase()} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="min-w-0 font-semibold text-sm text-text-primary group-hover:text-accent transition-colors leading-snug truncate">
                            {title}
                          </h3>
                          {item.inProgress && <InProgressBadge locale={locale} />}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{localized(item.description, item.descriptionEn)}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {githubLink ? (
                        <a
                          href={githubLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-accent hover:bg-bg-card transition-colors shrink-0"
                          title="GitHub"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d={ICONS.github} />
                          </svg>
                        </a>
                      ) : (
                        <span className="w-7 h-7 shrink-0" aria-hidden />
                      )}
                      {demoLink ? (
                        <a
                          href={demoLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-accent hover:bg-accent/8 transition-colors shrink-0"
                          title="Live Demo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      ) : (
                        <span className="w-7 h-7 shrink-0" aria-hidden />
                      )}
                      <div className="hidden sm:flex flex-wrap gap-1 shrink-0 w-[200px] justify-end ml-1">
                        {techs.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className={`px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors duration-150 ${
                              selectedTechs.has(tech)
                                ? "bg-accent text-white"
                                : "bg-accent/8 dark:bg-accent/15 text-accent"
                            }`}
                          >
                            {tech}
                          </span>
                        ))}
                        {techs.length > 3 && <span className="text-[11px] text-text-tertiary">+{techs.length - 3}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
                })}
              </AnimatePresence>
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

        {/* ── Experience ── */}
        {experiences.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 md:gap-8 py-8">
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

        {/* ── Activities ── */}
        {activities.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3 md:gap-8 py-8">
            <SectionLabel>{t("resume.activities")}</SectionLabel>
            <div className="space-y-5">
              {activities.map((act) => (
                <div key={act.id}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary leading-snug">
                        {act.link ? (
                          <a href={act.link} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                            {localized(act.title, act.titleEn)}
                          </a>
                        ) : localized(act.title, act.titleEn)}
                      </h3>
                      <p className="text-sm text-accent">{localized(act.organization, act.organizationEn)}</p>
                    </div>
                    <span className="text-xs text-text-tertiary tabular-nums mt-0.5 sm:mt-0 shrink-0">
                      {act.date}
                    </span>
                  </div>
                  {act.description && (
                    <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{localized(act.description, act.descriptionEn)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ━━━ RECENT POSTS ━━━ */}
      {posts.length > 0 && (
        <section className="mt-12">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className={`${EYEBROW} text-text-tertiary`}>{t("resume.recentPosts")}</h2>
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
