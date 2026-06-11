"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ThumbnailPicker, type ThumbnailValue } from "@/components/admin/ThumbnailPicker";
import { updatePublishSettings } from "@/actions/posts";
import { updatePostProjects } from "@/actions/portfolios";

export interface PublishablePost {
  id: number;
  title: string;
  titleEn: string | null;
  content: string;
  thumbnail: string | null;
  thumbnailTextLength: number | null;
  thumbnailTextLengthEn: number | null;
  showTitleOnThumbnail: boolean;
  isPublished: boolean;
  isPrivate: boolean;
}

interface Props {
  post: PublishablePost;
  projects: { id: number; title: string }[];
  initialProjectIds: number[];
  onClose: () => void;
  onSaved: () => void;
}

export function PublishSettingsModal({ post, projects, initialProjectIds, onClose, onSaved }: Props) {
  const [thumb, setThumb] = useState<ThumbnailValue>({
    thumbnail: post.thumbnail,
    textLength: post.thumbnailTextLength ?? 8,
    textLengthEn: post.thumbnailTextLengthEn ?? 8,
    showTitleOnThumbnail: post.showTitleOnThumbnail ?? false,
  });
  const [isPrivate, setIsPrivate] = useState<boolean>(post.isPrivate);
  const [projectIds, setProjectIds] = useState<number[]>(initialProjectIds);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updatePublishSettings(post.id, {
      thumbnail: thumb.thumbnail,
      thumbnailTextLength: thumb.thumbnail ? null : thumb.textLength,
      thumbnailTextLengthEn: thumb.thumbnail ? null : thumb.textLengthEn,
      showTitleOnThumbnail: thumb.showTitleOnThumbnail,
      isPublished: true,
      isPrivate,
    });
    await updatePostProjects(post.id, projectIds);
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <ConfirmModal
      title="출간 설정"
      open
      saving={saving}
      confirmLabel={post.isPublished ? "저장" : isPrivate ? "비공개 출간" : "출간하기"}
      savingLabel="저장 중..."
      onClose={onClose}
      onConfirm={handleSave}
    >
      {/* 대표 이미지 — 글쓰기 페이지와 공용 컴포넌트 */}
      <ThumbnailPicker title={post.title} titleEn={post.titleEn} content={post.content} value={thumb} onChange={setThumb} />

      {/* 공개 설정 */}
      <section className="space-y-3">
        <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">공개 설정</h3>
        <div className="flex gap-3">
          <button onClick={() => setIsPrivate(false)} className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${!isPrivate ? "border-accent bg-accent/5" : "border-border hover:border-text-tertiary"}`}>
            <span className="text-sm font-medium block">공개</span>
            <span className="text-xs text-text-tertiary mt-1 block">모든 사람이 볼 수 있습니다</span>
          </button>
          <button onClick={() => setIsPrivate(true)} className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${isPrivate ? "border-accent bg-accent/5" : "border-border hover:border-text-tertiary"}`}>
            <span className="text-sm font-medium block">비공개</span>
            <span className="text-xs text-text-tertiary mt-1 block">나만 볼 수 있습니다</span>
          </button>
        </div>
      </section>

      {/* 연관 프로젝트 */}
      {projects.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">연관 프로젝트</h3>
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => {
              const sel = projectIds.includes(project.id);
              return (
                <button key={project.id} type="button"
                  onClick={() => setProjectIds((prev) => (sel ? prev.filter((id) => id !== project.id) : [...prev, project.id]))}
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
  );
}
