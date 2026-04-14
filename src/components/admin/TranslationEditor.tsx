"use client";

import { useState } from "react";
import { updateTranslation } from "@/actions/posts";
import { Button } from "@/components/ui/Button";

interface TranslationEditorProps {
  postId: number;
  titleEn: string | null;
  contentEn: string | null;
}

export function TranslationEditor({ postId, titleEn, contentEn }: TranslationEditorProps) {
  const [title, setTitle] = useState(titleEn || "");
  const [content, setContent] = useState(contentEn || "");
  const [saving, setSaving] = useState(false);

  if (!titleEn && !contentEn) return null;

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.set("id", String(postId));
    fd.set("titleEn", title);
    fd.set("contentEn", content);
    await updateTranslation(fd);
    setSaving(false);
  };

  return (
    <div className="space-y-4 border-t border-border pt-6 mt-6">
      <h3 className="text-lg font-bold">영문 번역 수정</h3>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm"
        placeholder="English title"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={15}
        className="w-full px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm font-mono"
        placeholder="English content (markdown)"
      />
      <Button onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "번역 저장"}</Button>
    </div>
  );
}
