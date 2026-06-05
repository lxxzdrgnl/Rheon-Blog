"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PostThumbnail } from "@/components/blog/PostThumbnail";
import { uploadImage } from "@/lib/upload";
import { updatePublishSettings } from "@/actions/posts";
import { updatePostProjects } from "@/actions/portfolios";

export interface PublishablePost {
  id: number;
  title: string;
  titleEn: string | null;
  thumbnail: string | null;
  thumbnailTextLength: number | null;
  thumbnailTextLengthEn: number | null;
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
  const [thumbnail, setThumbnail] = useState<string | null>(post.thumbnail);
  const [textLen, setTextLen] = useState<number>(post.thumbnailTextLength ?? 8);
  const [textLenEn, setTextLenEn] = useState<number>(post.thumbnailTextLengthEn ?? 8);
  const [isPrivate, setIsPrivate] = useState<boolean>(post.isPrivate);
  const [projectIds, setProjectIds] = useState<number[]>(initialProjectIds);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updatePublishSettings(post.id, {
      thumbnail,
      thumbnailTextLength: thumbnail ? null : textLen,
      thumbnailTextLengthEn: thumbnail ? null : textLenEn,
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
      {/* 대표 이미지 */}
      <section className="space-y-3">
        <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">대표 이미지</h3>
        <div className="max-w-xs">
          <PostThumbnail thumbnail={thumbnail} title={post.title} textLength={thumbnail ? undefined : textLen} />
        </div>
        {!thumbnail && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="text-xs text-text-tertiary whitespace-nowrap w-16">한글 글자 수</label>
              <input type="range" min={1} max={Math.max(post.title.length, 1)} value={textLen} onChange={(e) => setTextLen(Number(e.target.value))} className="flex-1 accent-accent" />
              <span className="text-xs text-text-secondary tabular-nums w-6 text-center">{textLen}</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-text-tertiary whitespace-nowrap w-16">영문 글자 수</label>
              <input type="range" min={1} max={Math.max((post.titleEn || post.title).length, 1)} value={textLenEn} onChange={(e) => setTextLenEn(Number(e.target.value))} className="flex-1 accent-accent" />
              <span className="text-xs text-text-secondary tabular-nums w-6 text-center">{textLenEn}</span>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg cursor-pointer hover:bg-bg-elevated transition-colors text-text-secondary">
            {uploading ? "업로드 중..." : "이미지 업로드"}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const url = await uploadImage(file);
                if (url) setThumbnail(url);
              } finally {
                setUploading(false);
                e.target.value = "";
              }
            }} />
          </label>
          {thumbnail && (
            <button type="button" onClick={() => setThumbnail(null)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-bg-elevated transition-colors text-text-secondary">
              제목으로 표시
            </button>
          )}
        </div>
      </section>

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
