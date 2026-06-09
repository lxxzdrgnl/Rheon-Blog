"use client";

import { useState } from "react";
import { createComment } from "@/actions/comments";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/provider";

// 새 댓글용(하단)과 답글용(댓글 아래 인라인)을 같이 쓰는 댓글 입력 폼.
export function CommentForm({
  postId,
  slug,
  parentId = null,
  onSubmitted,
  onCancel,
  compact = false,
}: {
  postId: number;
  slug: string;
  parentId?: number | null;
  onSubmitted: () => void;
  onCancel?: () => void; // 있으면 답글 모드(취소 버튼 표시)
  compact?: boolean;
}) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !password || !content) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("postId", String(postId));
    fd.set("slug", slug);
    fd.set("nickname", nickname);
    fd.set("password", password);
    fd.set("content", content);
    if (parentId) fd.set("parentId", String(parentId));
    await createComment(fd);
    setContent("");
    setSubmitting(false);
    onSubmitted();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "space-y-3 rounded-lg border border-border p-4" : "space-y-3 mt-8"}
    >
      {onCancel && (
        <div className="flex items-center gap-2 text-sm text-accent">
          <span>답글 작성 중</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-text-secondary hover:text-accent"
          >
            &times;
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t("comment.nickname")} className="min-w-0 px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("comment.password")} className="min-w-0 px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm" required />
      </div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("comment.content")} rows={compact ? 3 : 4} className="w-full px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm resize-none" required />
      <Button type="submit" disabled={submitting}>{submitting ? "..." : t("comment.submit")}</Button>
    </form>
  );
}
