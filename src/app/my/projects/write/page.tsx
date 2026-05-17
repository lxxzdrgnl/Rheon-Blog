"use client";

import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getPosts } from "@/actions/posts";
import { getPortfolioById, createPortfolio, updatePortfolio, getPortfolioPosts, translatePortfolio } from "@/actions/portfolios";
import { importFromGitHub } from "@/actions/github-import";
import { uploadImage } from "@/lib/upload";

const BADGE_OPTIONS = [
  { value: "github", label: "GitHub" },
  { value: "demo", label: "Demo / Live" },
  { value: "docs", label: "Docs" },
  { value: "figma", label: "Figma" },
  { value: "npm", label: "npm" },
  { value: "link", label: "Link" },
] as const;

type BadgeType = (typeof BADGE_OPTIONS)[number]["value"];

interface ProjectLink {
  badge: BadgeType;
  label: string;
  url: string;
}

interface Post {
  id: number;
  title: string;
  isPublished: boolean;
}

export default function ProjectWritePage() {
  return (
    <Suspense>
      <ProjectWritePageContent />
    </Suspense>
  );
}

function ProjectWritePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [desc, setDesc] = useState("");
  const [descEn, setDescEn] = useState("");
  const [content, setContent] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [tech, setTech] = useState("");
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [icon, setIcon] = useState("");
  const [thumb, setThumb] = useState("");
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [postSearch, setPostSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showGithubImport, setShowGithubImport] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const originalRef = useRef({ title: "", desc: "", content: "" });

  useEffect(() => {
    getPosts().then((p) => setAllPosts(p as Post[]));
  }, []);

  useEffect(() => {
    if (editId) {
      getPortfolioById(editId).then((p) => {
        if (p) {
          setTitle(p.title);
          setTitleEn(p.titleEn || "");
          setDesc(p.description);
          setDescEn(p.descriptionEn || "");
          setContent(p.content || "");
          setContentEn(p.contentEn || "");
          setTech(JSON.parse(p.techStack || "[]").join(", "));
          setThumb(p.thumbnail || "");
          setIcon(p.icon || "");
          originalRef.current = { title: p.title, desc: p.description, content: p.content || "" };
          try {
            const parsed = JSON.parse(p.link || "[]");
            setLinks(parsed.map((l: { badge?: string; label?: string; url: string }) => ({
              badge: l.badge || "link",
              label: l.label || "",
              url: l.url,
            })));
          } catch { if (p.link) setLinks([{ badge: "link" as BadgeType, label: "Link", url: p.link }]); }
        }
      });
      getPortfolioPosts(editId).then((posts) => setSelectedPostIds(posts.map((p) => p.id)));
    }
  }, [editId]);

  const publishedPosts = useMemo(() => allPosts.filter((p) => p.isPublished), [allPosts]);
  const filteredPosts = useMemo(() => {
    if (!postSearch.trim()) return publishedPosts;
    return publishedPosts.filter((p) => p.title.toLowerCase().includes(postSearch.toLowerCase()));
  }, [publishedPosts, postSearch]);

  const handleImageUpload = uploadImage;

  // AI 번역: 변경된 필드만
  const handleTranslate = async () => {
    if (!title.trim()) { alert("프로젝트명을 입력하세요."); return; }
    if (!desc.trim()) { alert("한줄 소개를 입력하세요."); return; }

    const orig = originalRef.current;
    const changed: { title?: string; description?: string; content?: string } = {};
    if (title !== orig.title) changed.title = title;
    if (desc !== orig.desc) changed.description = desc;
    if (content !== orig.content) changed.content = content;

    // 새 프로젝트이거나 영문이 비어있으면 전부 번역
    if (!editId && !titleEn) {
      changed.title = title;
      changed.description = desc;
      if (content.trim()) changed.content = content;
    }

    if (Object.keys(changed).length === 0) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    setTranslating(true);
    try {
      const result = await translatePortfolio(changed);
      if (result.titleEn) setTitleEn(result.titleEn);
      if (result.descriptionEn) setDescEn(result.descriptionEn);
      if (result.contentEn !== undefined) setContentEn(result.contentEn || "");
      setLang("en"); // 번역 후 영문 탭으로 전환
    } catch {
      alert("번역에 실패했습니다.");
    }
    setTranslating(false);
  };

  const handleGithubImport = async () => {
    if (!githubUrl.trim()) return;
    setImporting(true);
    try {
      const result = await importFromGitHub(githubUrl.trim());
      setTitle(result.title);
      setTitleEn(result.titleEn);
      setDesc(result.description);
      setDescEn(result.descriptionEn);
      setContent(result.content);
      setTech(result.techStack.join(", "));
      setLinks((prev) => [
        { badge: "github" as BadgeType, label: "GitHub", url: result.repoUrl },
        ...prev,
      ]);
      setShowGithubImport(false);
      setGithubUrl("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "가져오기에 실패했습니다.");
    }
    setImporting(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { alert("프로젝트명을 입력하세요."); return; }
    if (!desc.trim()) { alert("한줄 소개를 입력하세요."); return; }

    setSaving(true);
    const fd = new FormData();
    if (editId) fd.set("id", String(editId));
    fd.set("title", title); fd.set("titleEn", titleEn);
    fd.set("description", desc); fd.set("descriptionEn", descEn);
    fd.set("content", content); fd.set("contentEn", contentEn);
    fd.set("techStack", tech);
    fd.set("link", JSON.stringify(links.filter((l) => l.url.trim()).map((l) => ({ ...l, label: l.label || BADGE_OPTIONS.find((o) => o.value === l.badge)?.label || l.badge }))));
    fd.set("icon", icon);
    fd.set("thumbnail", thumb);
    fd.set("postIds", JSON.stringify(selectedPostIds));
    editId ? await updatePortfolio(fd) : await createPortfolio(fd);
    setSaving(false);
    router.push("/my/projects");
  };

  const addLink = () => setLinks((prev) => [...prev, { badge: "link" as BadgeType, label: "", url: "" }]);
  const removeLink = (i: number) => setLinks((prev) => prev.filter((_, j) => j !== i));
  const updateLink = (i: number, field: "badge" | "label" | "url", value: string) => {
    setLinks((prev) => prev.map((l, j) => j === i ? { ...l, [field]: value } : l));
  };
  const togglePost = (id: number) => {
    setSelectedPostIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // 현재 언어에 따른 값
  const currentTitle = lang === "en" ? titleEn : title;
  const setCurrentTitle = lang === "en" ? setTitleEn : setTitle;
  const currentDesc = lang === "en" ? descEn : desc;
  const setCurrentDesc = lang === "en" ? setDescEn : setDesc;
  const currentContent = lang === "en" ? contentEn : content;
  const setCurrentContent = lang === "en" ? setContentEn : setContent;

  return (
    <div className="flex flex-col h-screen page-editor">
      {/* Top */}
      <div className="pt-5 pb-3 space-y-2 shrink-0">
        {/* Language toggle */}
        {/* GitHub Import */}
        {showGithubImport && (
          <div className="flex items-center gap-2 p-3 bg-bg-elevated rounded-lg border border-border">
            <svg className="w-4 h-4 text-text-secondary shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGithubImport()}
              placeholder="https://github.com/owner/repo"
              className="flex-1 px-3 py-1.5 text-sm bg-bg-primary border border-border rounded-md focus:outline-none focus:border-accent"
              autoFocus
            />
            <button
              onClick={handleGithubImport}
              disabled={importing}
              className="px-3 py-1.5 text-xs bg-text-primary text-bg-primary rounded-md hover:opacity-80 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {importing ? "가져오는 중..." : "가져오기"}
            </button>
            <button
              onClick={() => { setShowGithubImport(false); setGithubUrl(""); }}
              className="p-1 text-text-tertiary hover:text-text-primary"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-bg-elevated rounded-lg p-0.5">
              <button
                onClick={() => setLang("ko")}
                className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${lang === "ko" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
              >
                한국어
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${lang === "en" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
              >
                English
              </button>
            </div>
            {!editId && !showGithubImport && (
              <button
                onClick={() => setShowGithubImport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-bg-elevated transition-colors text-text-secondary"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub에서 가져오기
              </button>
            )}
          </div>
          <button
            onClick={handleTranslate}
            disabled={translating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-bg-elevated transition-colors text-text-secondary disabled:opacity-50"
          >
            {translating ? (
              <>
                <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                번역 중...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                </svg>
                AI 번역
              </>
            )}
          </button>
        </div>

        <input
          type="text"
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
          placeholder={lang === "en" ? "Project Name" : "프로젝트명을 입력하세요"}
          className="w-full text-2xl font-bold bg-transparent border-0 border-b-2 border-border pb-2 focus:outline-none focus:border-text-primary text-text-primary placeholder:text-text-tertiary"
        />
        <input
          type="text"
          value={currentDesc}
          onChange={(e) => setCurrentDesc(e.target.value)}
          placeholder={lang === "en" ? "Short description" : "한줄 소개를 입력하세요"}
          className="w-full text-sm bg-transparent focus:outline-none text-text-secondary placeholder:text-text-tertiary"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="py-6 space-y-8">
          {/* Related posts */}
          {publishedPosts.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
                {lang === "en" ? "Related Posts" : "관련 포스트"}
              </h3>
              {selectedPostIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPostIds.map((id) => {
                    const post = allPosts.find((p) => p.id === id);
                    if (!post) return null;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-bg-elevated rounded-md text-xs">
                        {post.title}
                        <button onClick={() => togglePost(id)} className="text-text-tertiary hover:text-text-primary ml-0.5">&times;</button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder={lang === "en" ? "Search posts..." : "포스트 검색..."}
                  className="w-full px-3 py-2 pl-8 rounded-lg border border-border bg-bg-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              {filteredPosts.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border/50">
                  {filteredPosts.map((post) => (
                    <label key={post.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-bg-elevated cursor-pointer text-sm border-b border-border/20 last:border-b-0">
                      <input type="checkbox" checked={selectedPostIds.includes(post.id)} onChange={() => togglePost(post.id)} className="rounded" />
                      <span className="truncate">{post.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Tech stack */}
          <section className="space-y-3">
            <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
              {lang === "en" ? "Tech Stack" : "기술스택"}
            </h3>
            <Input value={tech} onChange={(e) => setTech(e.target.value)} placeholder="React, TypeScript, Docker, ..." />
          </section>

          {/* Links */}
          <section className="space-y-3">
            <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
              {lang === "en" ? "Links" : "링크"}
            </h3>
            {links.map((l, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={l.badge}
                  onChange={(e) => updateLink(i, "badge", e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-border bg-bg-primary text-text-primary text-sm shrink-0 focus:outline-none focus:border-accent"
                >
                  {BADGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Input placeholder="https://..." value={l.url} onChange={(e) => updateLink(i, "url", e.target.value)} />
                <button type="button" onClick={() => removeLink(i)} className="shrink-0 p-2 text-text-tertiary hover:text-red-500 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addLink()} className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-bg-elevated transition-colors text-text-secondary">
              + {lang === "en" ? "Add link" : "링크 추가"}
            </button>
          </section>

          {/* Icon */}
          <section className="space-y-3">
            <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
              {lang === "en" ? "Icon URL" : "아이콘 URL"}
            </h3>
            <div className="flex items-center gap-3">
              {icon && <img src={icon} alt="" className="w-5 h-5 rounded object-contain shrink-0" />}
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder={lang === "en" ? "Favicon URL (auto-detected if empty)" : "파비콘 URL (비워두면 자동 감지)"}
              />
            </div>
          </section>

          {/* Thumbnail */}
          <section className="space-y-3">
            <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
              {lang === "en" ? "Thumbnail" : "썸네일"}
            </h3>
            {thumb ? (
              <div className="relative group inline-block">
                <img src={thumb} alt="" className="w-40 h-24 object-cover rounded-lg border border-border" />
                <button onClick={() => setThumb("")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">&times;</button>
              </div>
            ) : (
              <label className="w-40 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-text-tertiary transition-colors text-text-tertiary inline-flex">
                <div className="text-center">
                  <span className="text-xl">+</span>
                  <p className="text-xs">{lang === "en" ? "Upload" : "업로드"}</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await handleImageUpload(file);
                  if (url) setThumb(url);
                  e.target.value = "";
                }} />
              </label>
            )}
          </section>

          {/* Description (markdown) */}
          <section className="space-y-3">
            <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">
              {lang === "en" ? "Description (markdown)" : "상세 설명 (마크다운)"}
            </h3>
            <div className="min-h-[300px] border border-border rounded-lg overflow-hidden">
              <PostEditor value={currentContent} onChange={setCurrentContent} onImageUpload={handleImageUpload} />
            </div>
          </section>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-14 border-t border-border bg-bg-primary shrink-0">
        <div className="h-full flex items-center justify-between">
          <button onClick={() => router.push("/my/projects")} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            나가기
          </button>
          <Button onClick={handleSave} disabled={saving || translating}>
            {saving ? "저장 중..." : editId ? "수정" : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
