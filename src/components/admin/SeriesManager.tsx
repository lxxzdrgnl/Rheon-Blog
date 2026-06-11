"use client";

import { useState, useEffect } from "react";
import {
  getSeriesWithPostCount, createSeries, updateSeries, deleteSeries,
  getSeriesPosts, reorderSeriesPosts,
} from "@/actions/series";
import { ThumbnailPicker } from "@/components/admin/ThumbnailPicker";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type SeriesItem = {
  id: number; title: string; titleEn: string | null; slug: string;
  description: string | null; descriptionEn: string | null;
  thumbnail: string | null;
  thumbnailTextLength: number | null; thumbnailTextLengthEn: number | null;
  showTitleOnThumbnail: boolean;
  createdAt: string; postCount: number;
};
type SeriesPost = { id: number; title: string; titleEn: string | null; slug: string; seriesOrder: number | null };

const inputClass = "w-full px-3 py-2 text-sm bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary";
const labelClass = "block text-xs text-text-tertiary uppercase tracking-wider font-medium mb-1.5";

export function SeriesManager() {
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [editing, setEditing] = useState<Partial<SeriesItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [posts, setPosts] = useState<SeriesPost[]>([]);

  const reload = async () => setSeriesList(await getSeriesWithPostCount());
  useEffect(() => { reload(); }, []);

  useEffect(() => {
    if (expandedId == null) { setPosts([]); return; }
    getSeriesPosts(expandedId).then(setPosts);
  }, [expandedId]);

  const handleSave = async () => {
    if (!editing?.title?.trim()) return;
    setSaving(true);
    const data = {
      title: editing.title,
      titleEn: editing.titleEn || undefined,
      description: editing.description || undefined,
      descriptionEn: editing.descriptionEn || undefined,
      thumbnail: editing.thumbnail ?? null,
      thumbnailTextLength: editing.thumbnailTextLength ?? undefined,
      thumbnailTextLengthEn: editing.thumbnailTextLengthEn ?? undefined,
      showTitleOnThumbnail: editing.showTitleOnThumbnail ?? false,
    };
    if (editing.id) await updateSeries(editing.id, data);
    else await createSeries(data);
    setSaving(false);
    setEditing(null);
    await reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("시리즈를 삭제하시겠습니까? 포스트는 삭제되지 않습니다.")) return;
    await deleteSeries(id);
    if (expandedId === id) setExpandedId(null);
    await reload();
  };

  const handleMovePost = async (idx: number, dir: -1 | 1) => {
    if (expandedId == null) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= posts.length) return;
    const next = [...posts];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setPosts(next);
    await reorderSeriesPosts(expandedId, next.map((p) => p.id));
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setEditing({})}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-bg-primary text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        시리즈 추가
      </button>

      <div className="space-y-2.5">
        {seriesList.map((s) => {
          const open = expandedId === s.id;
          return (
            <div key={s.id} className={`rounded-xl border transition-colors ${open ? "border-accent/40" : "border-border"}`}>
              {/* 헤더 행 — 클릭하면 포스트 순서 펼침 */}
              <div
                onClick={() => setExpandedId(open ? null : s.id)}
                className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-bg-card/40 transition-colors rounded-xl"
              >
                <svg
                  className={`w-4 h-4 shrink-0 text-text-tertiary transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-text-primary truncate">{s.title}</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">{s.postCount}개 포스트</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(s); }}
                    className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-elevated transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="px-2.5 py-1.5 text-xs text-text-tertiary hover:text-red-500 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>

              {/* 포스트 순서 (펼침) */}
              {open && (
                <div className="border-t border-border px-4 py-4 bg-bg-card/20 rounded-b-xl">
                  <h4 className="text-xs text-text-tertiary uppercase tracking-wider font-medium mb-3">포스트 순서</h4>
                  {posts.length === 0 ? (
                    <p className="text-sm text-text-tertiary py-2">이 시리즈에 포스트가 없습니다.</p>
                  ) : (
                    <ol className="space-y-1.5">
                      {posts.map((post, idx) => (
                        <li key={post.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-bg-primary">
                          <div className="flex flex-col shrink-0 -my-1">
                            <button
                              onClick={() => handleMovePost(idx, -1)}
                              disabled={idx === 0}
                              aria-label="위로"
                              className="h-4 leading-none text-[11px] text-text-tertiary hover:text-accent disabled:opacity-25 disabled:hover:text-text-tertiary transition-colors"
                            >▲</button>
                            <button
                              onClick={() => handleMovePost(idx, 1)}
                              disabled={idx === posts.length - 1}
                              aria-label="아래로"
                              className="h-4 leading-none text-[11px] text-text-tertiary hover:text-accent disabled:opacity-25 disabled:hover:text-text-tertiary transition-colors"
                            >▼</button>
                          </div>
                          <span className="w-5 shrink-0 text-xs text-text-tertiary tabular-nums text-right">{idx + 1}</span>
                          <span className="flex-1 min-w-0 text-sm text-text-primary truncate">{post.title}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {seriesList.length === 0 && (
          <p className="text-sm text-text-tertiary py-8 text-center">아직 시리즈가 없습니다. “시리즈 추가”로 만들어 보세요.</p>
        )}
      </div>

      {/* 추가/수정 모달 */}
      {editing && (
        <ConfirmModal
          title={editing.id ? "시리즈 수정" : "새 시리즈"}
          open
          saving={saving}
          confirmLabel={editing.id ? "저장" : "추가"}
          onClose={() => setEditing(null)}
          onConfirm={handleSave}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelClass}>제목</label><input className={inputClass} value={editing.title || ""} autoFocus onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="인공지능" /></div>
            <div><label className={labelClass}>Title (EN)</label><input className={inputClass} value={editing.titleEn || ""} onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })} placeholder="Artificial Intelligence" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelClass}>설명</label><textarea className={inputClass + " h-24 resize-none"} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><label className={labelClass}>Description (EN)</label><textarea className={inputClass + " h-24 resize-none"} value={editing.descriptionEn || ""} onChange={(e) => setEditing({ ...editing, descriptionEn: e.target.value })} /></div>
          </div>

          <ThumbnailPicker
            title={editing.title || ""}
            titleEn={editing.titleEn || null}
            content=""
            value={{
              thumbnail: editing.thumbnail ?? null,
              textLength: editing.thumbnailTextLength ?? 8,
              textLengthEn: editing.thumbnailTextLengthEn ?? 8,
              showTitleOnThumbnail: editing.showTitleOnThumbnail ?? false,
            }}
            onChange={(v) => setEditing({ ...editing, thumbnail: v.thumbnail, thumbnailTextLength: v.textLength, thumbnailTextLengthEn: v.textLengthEn, showTitleOnThumbnail: v.showTitleOnThumbnail })}
          />
        </ConfirmModal>
      )}
    </div>
  );
}
