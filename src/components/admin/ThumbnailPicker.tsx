"use client";

import { useMemo, useState } from "react";
import { extractImageUrls } from "@/lib/markdown";
import { uploadImage } from "@/lib/upload";
import { PostThumbnail } from "@/components/blog/PostThumbnail";

export interface ThumbnailValue {
  thumbnail: string | null;
  textLength: number;
  textLengthEn: number;
  showTitleOnThumbnail: boolean;
}

interface Props {
  title: string;
  titleEn: string | null;
  /** 본문 마크다운 — 여기서 이미지를 추출해 선택 그리드로 보여준다 */
  content: string;
  value: ThumbnailValue;
  onChange: (next: ThumbnailValue) => void;
}

/**
 * 대표 이미지 설정 공용 UI.
 * - 본문 이미지 중 골라 썸네일 지정(그리드) / 직접 업로드 / "제목으로 표시" 폴백
 * - 폴백일 때 글자 수(ko/en) 슬라이더
 * - 이미지일 때 "썸네일에 제목 표시" 오버레이 토글
 *
 * 글쓰기 페이지와 글 목록의 출간 설정 모달이 공용으로 사용한다 — UI 중복/엇갈림 방지.
 */
export function ThumbnailPicker({ title, titleEn, content, value, onChange }: Props) {
  const { thumbnail, textLength, textLengthEn, showTitleOnThumbnail } = value;
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [previewLang, setPreviewLang] = useState<"ko" | "en">("ko");
  const [uploading, setUploading] = useState(false);

  const set = (patch: Partial<ThumbnailValue>) => onChange({ ...value, ...patch });

  const images = useMemo(() => {
    const fromContent = extractImageUrls(content || "");
    return [...fromContent, ...uploaded.filter((u) => !fromContent.includes(u))];
  }, [content, uploaded]);

  const previewTitle = previewLang === "en" ? (titleEn || title) : title;
  const previewLen = previewLang === "en" ? textLengthEn : textLength;

  return (
    <section className="space-y-3">
      <h3 className="text-xs text-text-tertiary uppercase tracking-wider font-medium">대표 이미지</h3>

      {/* 미리보기 — 이미지면 실제 썸네일(+오버레이), 폴백이면 제목 커버 */}
      <div className="max-w-xs">
        <PostThumbnail
          thumbnail={thumbnail}
          title={previewTitle}
          textLength={thumbnail ? undefined : previewLen}
          titleOverlay={!!thumbnail && showTitleOnThumbnail}
        />
      </div>

      {/* 본문 이미지 선택 그리드 */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => set({ thumbnail: null })}
            className={`relative aspect-[4/3] rounded-lg border-2 flex items-center justify-center text-center px-1 transition-all ${
              !thumbnail ? "border-accent bg-accent/5" : "border-border hover:border-text-tertiary"
            }`}
          >
            <span className="text-[11px] text-text-tertiary leading-tight">제목으로<br />표시</span>
          </button>
          {images.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => set({ thumbnail: url })}
              className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                thumbnail === url ? "border-accent" : "border-transparent hover:border-border"
              }`}
            >
              <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* 폴백 커버 글자 수 */}
      {!thumbnail && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-tertiary whitespace-nowrap w-16">한글 글자 수</label>
            <input type="range" min={1} max={Math.max(title.length, 1)} value={textLength}
              onChange={(e) => { set({ textLength: Number(e.target.value) }); setPreviewLang("ko"); }}
              className="flex-1 accent-accent" />
            <span className="text-xs text-text-secondary tabular-nums w-6 text-center">{textLength}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-tertiary whitespace-nowrap w-16">영문 글자 수</label>
            <input type="range" min={1} max={Math.max((titleEn || title).length, 1)} value={textLengthEn}
              onChange={(e) => { set({ textLengthEn: Number(e.target.value) }); setPreviewLang("en"); }}
              className="flex-1 accent-accent" />
            <span className="text-xs text-text-secondary tabular-nums w-6 text-center">{textLengthEn}</span>
          </div>
        </div>
      )}

      {/* 이미지일 때 — 제목 오버레이 토글 */}
      {thumbnail && (
        <label className="flex items-center justify-between gap-3 px-1 cursor-pointer">
          <span className="text-xs text-text-secondary">썸네일 위에 제목 표시 <span className="text-text-tertiary">(글자에 그림자)</span></span>
          <button
            type="button"
            role="switch"
            aria-checked={showTitleOnThumbnail}
            onClick={() => set({ showTitleOnThumbnail: !showTitleOnThumbnail })}
            className={`relative w-9 h-5 rounded-full transition-colors ${showTitleOnThumbnail ? "bg-accent" : "bg-border"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showTitleOnThumbnail ? "translate-x-4" : ""}`} />
          </button>
        </label>
      )}

      {/* 업로드 */}
      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg cursor-pointer hover:bg-bg-elevated transition-colors text-text-secondary">
        {uploading ? "업로드 중..." : "이미지 업로드"}
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          try {
            const url = await uploadImage(file);
            if (url) { setUploaded((p) => [...p, url]); set({ thumbnail: url }); }
          } finally {
            setUploading(false);
            e.target.value = "";
          }
        }} />
      </label>
    </section>
  );
}
