"use client";

import { useState, useEffect } from "react";
import {
  getSeriesWithPostCount, createSeries, updateSeries, deleteSeries,
  getSeriesPosts, reorderSeriesPosts,
} from "@/actions/series";

type SeriesItem = { id: number; title: string; titleEn: string | null; slug: string; description: string | null; descriptionEn: string | null; createdAt: string; postCount: number };
type SeriesPost = { id: number; title: string; titleEn: string | null; slug: string; seriesOrder: number | null };

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [editing, setEditing] = useState<Partial<SeriesItem> | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [seriesPosts, setSeriesPosts] = useState<SeriesPost[]>([]);

  const reload = async () => {
    const list = await getSeriesWithPostCount();
    setSeriesList(list);
  };

  useEffect(() => { reload(); }, []);

  useEffect(() => {
    if (selectedSeries) {
      getSeriesPosts(selectedSeries).then(setSeriesPosts);
    }
  }, [selectedSeries]);

  const handleSave = async () => {
    if (!editing?.title) return;
    if (editing.id) {
      await updateSeries(editing.id, {
        title: editing.title,
        titleEn: editing.titleEn || undefined,
        description: editing.description || undefined,
        descriptionEn: editing.descriptionEn || undefined,
      });
    } else {
      await createSeries({
        title: editing.title,
        titleEn: editing.titleEn || undefined,
        description: editing.description || undefined,
        descriptionEn: editing.descriptionEn || undefined,
      });
    }
    setEditing(null);
    await reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("시리즈를 삭제하시겠습니까? 포스트는 삭제되지 않습니다.")) return;
    await deleteSeries(id);
    if (selectedSeries === id) { setSelectedSeries(null); setSeriesPosts([]); }
    await reload();
  };

  const handleMovePost = async (idx: number, dir: -1 | 1) => {
    if (!selectedSeries) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= seriesPosts.length) return;
    const newPosts = [...seriesPosts];
    [newPosts[idx], newPosts[swapIdx]] = [newPosts[swapIdx], newPosts[idx]];
    setSeriesPosts(newPosts);
    await reorderSeriesPosts(selectedSeries, newPosts.map((p) => p.id));
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary";
  const labelClass = "block text-xs text-text-tertiary uppercase tracking-wider font-medium mb-1.5";
  const btnPrimary = "px-4 py-2 bg-accent text-bg-primary text-sm font-medium rounded-lg hover:opacity-90 transition-opacity";
  const btnSecondary = "px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-elevated transition-colors";

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">시리즈 관리</h1>

      <button onClick={() => setEditing({})} className={btnPrimary + " mb-4"}>+ 시리즈 추가</button>

      {editing && (
        <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>제목</label><input className={inputClass} value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><label className={labelClass}>Title (EN)</label><input className={inputClass} value={editing.titleEn || ""} onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>설명</label><textarea className={inputClass + " h-20"} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><label className={labelClass}>Description (EN)</label><textarea className={inputClass + " h-20"} value={editing.descriptionEn || ""} onChange={(e) => setEditing({ ...editing, descriptionEn: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className={btnPrimary}>저장</button>
            <button onClick={() => setEditing(null)} className={btnSecondary}>취소</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          {seriesList.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSeries(s.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedSeries === s.id ? "border-accent bg-accent/5" : "border-border hover:border-text-tertiary"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">{s.title}</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">{s.postCount}개 포스트</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditing(s); }} className={btnSecondary}>수정</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-xs text-red-500 hover:text-red-400">삭제</button>
                </div>
              </div>
            </div>
          ))}
          {seriesList.length === 0 && <p className="text-sm text-text-tertiary">시리즈가 없습니다.</p>}
        </div>

        {selectedSeries && (
          <div>
            <h3 className="text-sm font-medium mb-3">포스트 순서</h3>
            <div className="space-y-2">
              {seriesPosts.map((post, idx) => (
                <div key={post.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMovePost(idx, -1)} disabled={idx === 0} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▲</button>
                    <button onClick={() => handleMovePost(idx, 1)} disabled={idx === seriesPosts.length - 1} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-text-tertiary mr-2">{idx + 1}.</span>
                    <span className="text-sm">{post.title}</span>
                  </div>
                </div>
              ))}
              {seriesPosts.length === 0 && <p className="text-sm text-text-tertiary">이 시리즈에 포스트가 없습니다.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
