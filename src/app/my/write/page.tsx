"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PostEditor, PostEditorHandle } from "@/components/admin/PostEditor";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { TagInput } from "@/components/admin/TagInput";
import { SlugInput } from "@/components/admin/SlugInput";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LanguageEditorBar } from "@/components/admin/LanguageEditorBar";
import { getCategories } from "@/actions/categories";
import { getPostById, getPostTags, savePost } from "@/actions/posts";
import { getPortfolios, getProjectsForPost, updatePostProjects } from "@/actions/portfolios";
import { getAllSeries } from "@/actions/series";
import { ThumbnailPicker, type ThumbnailValue } from "@/components/admin/ThumbnailPicker";
import { uploadImage } from "@/lib/upload";
import { streamTranslate } from "@/lib/translate-client";

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
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const [publishIsPrivate, setPublishIsPrivate] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [allSeries, setAllSeries] = useState<{ id: number; title: string }[]>([]);
  const [seriesId, setSeriesId] = useState<number | null>(null);
  const [seriesOrder, setSeriesOrder] = useState<string>("");
  const [thumbnailTextLength, setThumbnailTextLength] = useState<number>(8);
  const [thumbnailTextLengthEn, setThumbnailTextLengthEn] = useState<number>(8);
  const [showTitleOnThumbnail, setShowTitleOnThumbnail] = useState(false);
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
          if (post.thumbnailTextLength) setThumbnailTextLength(post.thumbnailTextLength);
          if (post.thumbnailTextLengthEn) setThumbnailTextLengthEn(post.thumbnailTextLengthEn);
          setShowTitleOnThumbnail(!!post.showTitleOnThumbnail);
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
        const translated = await streamTranslate({ kind: "selection", content, selected: sel.text });
        editorRef.current?.replaceSelection(translated.trim());
      } catch (e) {
        console.error("[translate] 선택 번역 실패:", e);
        alert(`번역에 실패했습니다.\n${e instanceof Error ? e.message : ""}`);
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

    // 영문이 비어있으면 변경 여부와 관계없이 번역 대상에 포함
    if (!titleEn) changed.title = title;
    if (!contentEn && content.trim()) changed.content = content;

    if (Object.keys(changed).length === 0) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    setTranslating(true);
    try {
      const jobs: Promise<void>[] = [];
      if (changed.title !== undefined) {
        jobs.push(streamTranslate({ kind: "title", text: changed.title }).then((t) => setTitleEn(t.trim())));
      }
      if (changed.content !== undefined) {
        setLang("en"); // 스트리밍되는 번역을 실시간으로 보여주기 위해 영문 탭으로 전환
        jobs.push(
          streamTranslate({ kind: "content", text: changed.content }, (full) => setContentEn(full)).then((t) =>
            setContentEn(t),
          ),
        );
      }
      await Promise.all(jobs);
      setLang("en");
    } catch (e) {
      console.error("[translate] 전체 번역 실패:", e);
      alert(`번역에 실패했습니다.\n${e instanceof Error ? e.message : ""}`);
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
    fd.set("thumbnailTextLength", String(!thumbnail ? thumbnailTextLength : 0));
    fd.set("thumbnailTextLengthEn", String(!thumbnail ? thumbnailTextLengthEn : 0));
    fd.set("showTitleOnThumbnail", String(showTitleOnThumbnail));
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
    fd.set("thumbnailTextLength", String(!thumbnail ? thumbnailTextLength : 0));
    fd.set("thumbnailTextLengthEn", String(!thumbnail ? thumbnailTextLengthEn : 0));
    fd.set("showTitleOnThumbnail", String(showTitleOnThumbnail));
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

  const thumbValue: ThumbnailValue = { thumbnail, textLength: thumbnailTextLength, textLengthEn: thumbnailTextLengthEn, showTitleOnThumbnail };
  const onThumbChange = (next: ThumbnailValue) => {
    setThumbnail(next.thumbnail);
    setThumbnailTextLength(next.textLength);
    setThumbnailTextLengthEn(next.textLengthEn);
    setShowTitleOnThumbnail(next.showTitleOnThumbnail);
  };

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
        <div className="flex flex-wrap items-center gap-3">
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
        {/* Thumbnail — 출간 설정 모달과 공용 컴포넌트 */}
        <ThumbnailPicker title={title} titleEn={titleEn} content={content} value={thumbValue} onChange={onThumbChange} />

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
