"use client";

import { useState } from "react";
import Link from "next/link";
import { getRecentComments, adminReply, adminDeleteComment } from "@/actions/comments";
import { Button } from "@/components/ui/Button";

type AdminComment = Awaited<ReturnType<typeof getRecentComments>>[number];

export function AdminCommentList({ initial }: { initial: AdminComment[] }) {
  const [comments, setComments] = useState<AdminComment[]>(initial);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = () => getRecentComments(200).then(setComments);

  const submitReply = async (c: AdminComment) => {
    if (!replyText.trim()) return;
    setBusy(true);
    await adminReply({ postId: c.postId, commentId: c.id, content: replyText, slug: c.postSlug });
    setReplyText("");
    setReplyTo(null);
    setBusy(false);
    reload();
  };

  const remove = async (c: AdminComment) => {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    setBusy(true);
    await adminDeleteComment(c.id, c.postSlug);
    setBusy(false);
    reload();
  };

  if (comments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-text-tertiary">아직 댓글이 없습니다</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/30 rounded-xl border border-border/30 bg-bg-card">
      {comments.map((c) => (
        <li key={c.id} className="p-4">
          <div className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
            <span className="font-medium text-text-secondary">{c.nickname}</span>
            {c.isOwner && <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent">운영자</span>}
            {c.parentId && <span className="px-1 rounded bg-bg-elevated">답글</span>}
            <span>·</span>
            <span>{new Date(c.createdAt).toLocaleString()}</span>
          </div>
          <p className={`text-sm whitespace-pre-wrap ${c.isDeleted ? "italic text-text-tertiary" : "text-text-primary"}`}>
            {c.isDeleted ? "삭제된 댓글" : c.content}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link href={`/post/${c.postSlug}`} className="text-xs text-text-tertiary hover:text-text-secondary truncate max-w-[40%]">
              {c.postTitle} &rarr;
            </Link>
            {!c.isDeleted && (
              <>
                <button onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText(""); }} className="text-xs text-text-secondary hover:text-accent">답글</button>
                <button onClick={() => remove(c)} disabled={busy} className="text-xs text-text-secondary hover:text-red-500">삭제</button>
              </>
            )}
          </div>
          {replyTo === c.id && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="운영자 답글 작성..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-sm resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={() => submitReply(c)} disabled={busy}>{busy ? "..." : "답글 등록"}</Button>
                <button onClick={() => setReplyTo(null)} className="text-xs text-text-tertiary hover:text-text-primary">취소</button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
