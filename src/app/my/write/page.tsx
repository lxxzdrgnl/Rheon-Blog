"use client";

import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PostEditor, PostEditorHandle } from "@/components/admin/PostEditor";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { TagInput } from "@/components/admin/TagInput";
import { SlugInput } from "@/components/admin/SlugInput";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LanguageEditorBar } from "@/components/admin/LanguageEditorBar";
import { getCategories } from "@/actions/categories";
import { getPostById, getPostTags, savePost, translatePost, translateSelection } from "@/actions/posts";
import { getPortfolios, getProjectsForPost, updatePostProjects } from "@/actions/portfolios";
import { getAllSeries } from "@/actions/series";
import { extractImageUrls } from "@/lib/markdown";
import { uploadImage } from "@/lib/upload";

interface Tag { id: number; name: string; nameEn: string; }

export default function WritePage() {
  return (
    <Suspense>
      <WritePageContent />
    </Suspense>
  );
}

function WritePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [content, setContent] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<{ id: number; parentId?: number | null; name: string; nameEn: string; slug: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [allProjects, setAllProjects] = useState<{ id: number; title: string; slug: string }[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [uploadedThumbnails, setUploadedThumbnails] = useState<string[]>([]);
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const [publishIsPrivate, setPublishIsPrivate] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [allSeries, setAllSeries] = useState<{ id: number; title: string }[]>([]);
  const [seriesId, setSeriesId] = useState<number | null>(null);
  const [seriesOrder, setSeriesOrder] = useState<string>("");
  const editorRef = useRef<PostEditorHandle>(null);
  const originalRef = useRef({ title: "", content: "" });

  useEffect(() => {
    getCategories().then(setCategories);
    getPortfolios().then((p) => setAllProjects(p.map((x) => ({ id: x.id, title: x.title, slug: x.slug }))));
    getAllSeries().then((s) => setAllSeries(s.map((x) => ({ id: x.id, title: x.title }))));
  }, []);

  useEffect(() => {
    if (editId) {
      getPostById(editId).then((post) => {
        if (post) {
          setTitle(post.title);
          setTitleEn(post.titleEn || "");
          setContent(post.content || "");
          setContentEn(post.contentEn || "");
          setSlug(post.slug);
          setCategoryId(post.categoryId);
          setThumbnail(post.thumbnail || "");
          originalRef.current = { title: post.title, content: post.content };
          if (post.seriesId) setSeriesId(post.seriesId);
          if (post.seriesOrder != null) setSeriesOrder(String(post.seriesOrder));
        }
      });
      getPostTags(editId).then(setSelectedTags);
      getProjectsForPost(editId).then((projects) => setSelectedProjectIds(projects.map((p) => p.id)));
    }
  }, [editId]);

  const handleImageUpload = uploadImage;

  const handleTranslate = async () => {
    // 선택 영역이 있으면 선택 부분만 번역하여 교체
    const sel = editorRef.current?.getSelection();
    if (sel) {
      setTranslating(true);
      try {
        const translated = await translateSelection(content, sel.text, contentEn);
        editorRef.current?.replaceSelection(translated);
      } catch {
        alert("번역에 실패했습니다.");
      }
      setTranslating(false);
      return;
    }

    // 전체 번역
    if (!title.trim()) { alert("제목을 입력하세요."); return; }
    if (!content.trim()) { alert("내용을 입력하세요."); return; }

    const orig = originalRef.current;
    const changed: { title?: string; content?: string } = {};
    if (title !== orig.title) changed.title = title;
    if (content !== orig.content) changed.content = content;

    if (!editId && !titleEn) {
      changed.title = title;
      if (content.trim()) changed.content = content;
    }

    if (Object.keys(changed).length === 0) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    setTranslating(true);
    try {
      const result = await translatePost(changed);
      if (result.titleEn) setTitleEn(result.titleEn);
      if (result.contentEn !== undefined) setContentEn(result.contentEn || "");
      setLang("en");
    } catch {
      alert("번역에 실패했습니다.");
    }
    setTranslating(false);
  };

  const handleDraft = async () => {
    if (!title.trim() && !content.trim()) { alert("제목 또는 내용을 입력하세요."); return; }
    setSaving(true);
    const fd = new FormData();
    if (editId) fd.set("id", String(editId));
    fd.set("title", title); fd.set("content", content); fd.set("slug", slug);
    fd.set("categoryId", String(categoryId || 0));
    fd.set("thumbnail", thumbnail || "");
    fd.set("tagIds", JSON.stringify(selectedTags.map((t) => t.id)));
    fd.set("publish", "false"); fd.set("isPrivate", "false");
    if (titleEn) fd.set("titleEn", titleEn);
    if (contentEn) fd.set("contentEn", contentEn);
    if (seriesId) fd.set("seriesId", String(seriesId));
    if (seriesOrder) fd.set("seriesOrder", seriesOrder);
    try {
      const result = await savePost(fd);
      if (selectedProjectIds.length > 0 || editId) await updatePostProjects(result.postId, selectedProjectIds);
      setSaving(false);
      alert("임시저장되었습니다.");
      router.push(`/my/write?id=${result.postId}`);
    } catch { setSaving(false); alert("저장 실패"); }
  };

  const openPublishModal = () => {
    if (!title.trim()) { alert("제목을 입력하세요."); return; }
    if (!categoryId) { alert("카테고리를 선택하세요."); return; }
    if (!content.trim()) { alert("내용을 입력하세요."); return; }
    setShowPublishModal(true);
  };

  const handlePublish = async () => {
    setSaving(true);
    const fd = new FormData();
    if (editId) fd.set("id", String(editId));
    fd.set("title", title); fd.set("content", content); fd.set("slug", slug);
    fd.set("categoryId", String(categoryId || 0));
    fd.set("thumbnail", thumbnail || "");
    fd.set("tagIds", JSON.stringify(selectedTags.map((t) => t.id)));
    fd.set("publish", "true"); fd.set("isPrivate", String(publishIsPrivate));
    if (titleEn) fd.set("titleEn", titleEn);
    if (contentEn) fd.set("contentEn", contentEn);
    if (seriesId) fd.set("seriesId", String(seriesId));
    if (seriesOrder) fd.set("seriesOrder", seriesOrder);
    try {
      const result = await savePost(fd);
      if (selectedProjectIds.length > 0 || editId) await updatePostProjects(result.postId, selectedProjectIds);
      setSaving(false);
      setShowPublishModal(false);
      router.push("/my");
    } catch {
      setSaving(false);
      alert("저장 실패");
    }
  };

  const images = useMemo(() => {
    const fromContent = extractImageUrls(content);
    const all = [...fromContent, ...uploadedThumbnails.filter((u) => !fromContent.includes(u))];
    return all;
  }, [content, uploadedThumbnails]);

  const currentTitle = lang === "en" ? titleEn : title;
  const setCurrentTitle = lang === "en" ? setTitleEn : setTitle;
  const currentContent = lang === "en" ? contentEn : content;
  const setCurrentContent = lang === "en" ? setContentEn : setContent;

  return (
    <div className="flex flex-col h-screen page-editor">
      {/* Top */}
      <div className="pt-5 pb-3 space-y-3 shrink-0">
        <LanguageEditorBar
          lang={lang}
          onLangChange={setLang}
          translating={translating}
          onTranslate={handleTranslate}
        />
        <input
          type="text" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)}
          placeholder={lang === "en" ? "Enter title" : "제목을 입력하세요"}
          className="w-full text-2xl font-bold bg-transparent border-0 border-b-2 border-border pb-2 focus:outline-none focus:border-text-primary text-text-primary placeholder:text-text-tertiary"
        />
        <div className="flex items-center gap-4">
          <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} onCategoriesChange={setCategories} />
          <SlugInput title={title} value={slug} onChange={setSlug} locked={!!editId} />
        </div>
        <TagInput selectedTags={selectedTags} onChange={setSelectedTags} />
        {/* Series */}
        <div className="flex items-center gap-3">
          <select
            value={seriesId || ""}
            onChange={(e) => setSeriesId(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 text-sm bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary"
          >
            <option value="">시리즈 없음</option>
            {allSeries.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          {seriesId && (
            <input
              type="number"
              value={seriesOrder}
              onChange={(e) => setSeriesOrder(e.target.value)}
              placeholder="순서 (비우면 자동)"
              className="w-40 px-3 py-1.5 text-sm bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary"
            />
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 pb-2">
        <PostEditor ref={editorRef} value={currentContent} onChange={setCurrentContent} onImageUpload={handleImageUpload} />
      </div>

      {/* Publish modal */}
      <ConfirmModal
        title="출간 설정"
        open={showPublishModal}
        saving={saving}
        confirmLabel={publishIsPrivate ? "비공개 출간" : "출간하기"}
        savingLabel="출간 중..."
        onClose={() => setShowPublishModal(false)}
        onConfirm={handlePublish}
      >
        {/* Thumbnail */}
        <section className="space-y-3">
          <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">대표 이미지</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setThumbnail(null)}
              className={`relative aspect-[4/3] rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                !thumbnail ? "border-accent bg-accent/5" : "border-border hover:border-text-tertiary"
              }`}
            >
              <span className="text-2xl font-bold text-text-primary">{title.slice(0, 8) || "제목"}</span>
              <span className="text-xs text-text-tertiary mt-2">제목으로 표시</span>
            </button>
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => setThumbnail(images[0])}
                className={`relative aspect-[4/3] rounded-xl border-2 overflow-hidden transition-all ${
                  thumbnail ? "border-accent" : "border-border hover:border-text-tertiary"
                }`}
              >
                <img src={images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded">이미지</span>
              </button>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((url) => (
                <button
                  key={url}
                  onClick={() => setThumbnail(url)}
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                    thumbnail === url ? "border-accent" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg cursor-pointer hover:bg-bg-elevated transition-colors text-text-secondary">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            이미지 업로드
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = await handleImageUpload(file);
              if (url) {
                setUploadedThumbnails((prev) => [...prev, url]);
                setThumbnail(url);
              }
              e.target.value = "";
            }} />
          </label>
        </section>

        {/* Visibility */}
        <section className="space-y-3">
          <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">공개 설정</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setPublishIsPrivate(false)}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                !publishIsPrivate ? "border-accent bg-accent/5" : "border-border hover:border-text-tertiary"
              }`}
            >
              <span className="text-sm font-medium block">공개</span>
              <span className="text-xs text-text-tertiary mt-1 block">모든 사람이 볼 수 있습니다</span>
            </button>
            <button
              onClick={() => setPublishIsPrivate(true)}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                publishIsPrivate ? "border-accent bg-accent/5" : "border-border hover:border-text-tertiary"
              }`}
            >
              <span className="text-sm font-medium block">비공개</span>
              <span className="text-xs text-text-tertiary mt-1 block">나만 볼 수 있습니다</span>
            </button>
          </div>
        </section>

        {/* Projects */}
        {allProjects.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">연관 프로젝트</h3>
            <div className="flex flex-wrap gap-2">
              {allProjects.map((project) => {
                const sel = selectedProjectIds.includes(project.id);
                return (
                  <button key={project.id} type="button"
                    onClick={() => setSelectedProjectIds((prev) => sel ? prev.filter((id) => id !== project.id) : [...prev, project.id])}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${sel ? "border-accent text-accent font-medium bg-accent/5" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
                  >
                    {project.title}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </ConfirmModal>

      {/* Bottom bar */}
      <div className="h-14 border-t border-border bg-bg-primary shrink-0">
        <div className="h-full flex items-center justify-between">
          <button onClick={() => router.push("/my")} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            나가기
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleDraft} disabled={saving} className="text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50">
              임시저장
            </button>
            <button onClick={openPublishModal} disabled={saving} className="px-5 py-2 bg-accent text-bg-primary text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              출간하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
