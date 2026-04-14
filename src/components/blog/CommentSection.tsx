"use client";

import { useState, useEffect } from "react";
import { getComments, createComment } from "@/actions/comments";
import { CommentItem } from "./CommentItem";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/provider";

interface Comment {
  id: number; postId: number; parentId: number | null; nickname: string; password: string; content: string; createdAt: string; isDeleted: boolean;
}

export function CommentSection({ postId, slug }: { postId: number; slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  const loadComments = () => getComments(postId).then(setComments);
  useEffect(() => { loadComments(); }, [postId]);

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
    if (replyTo) fd.set("parentId", String(replyTo));
    await createComment(fd);
    setContent("");
    setReplyTo(null);
    setSubmitting(false);
    loadComments();
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">{t("comment.title")} ({comments.length})</h3>
      <div className="divide-y divide-border">
        {topLevel.map((comment) => (
          <div key={comment.id}>
            <CommentItem comment={comment} slug={slug} onReply={(id) => setReplyTo(id)} />
            {replies.filter((r) => r.parentId === comment.id).map((reply) => (
              <CommentItem key={reply.id} comment={reply} slug={slug} onReply={() => setReplyTo(comment.id)} isReply />
            ))}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        {replyTo && (
          <div className="flex items-center gap-2 text-sm text-accent">
            <span>답글 작성 중</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-text-secondary hover:text-text-primary">&times;</button>
          </div>
        )}
        <div className="flex gap-3">
          <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t("comment.nickname")} className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("comment.password")} className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm" required />
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("comment.content")} rows={4} className="w-full px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm resize-none" required />
        <Button type="submit" disabled={submitting}>{submitting ? "..." : t("comment.submit")}</Button>
      </form>
    </div>
  );
}
