"use client";

import { useState } from "react";
import { deleteComment } from "@/actions/comments";
import { useI18n } from "@/i18n/provider";

interface CommentItemProps {
  comment: { id: number; nickname: string; content: string; createdAt: string; isDeleted: boolean; parentId: number | null; };
  slug: string;
  onReply: (commentId: number) => void;
  isReply?: boolean;
}

export function CommentItem({ comment, slug, onReply, isReply }: CommentItemProps) {
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [error, setError] = useState("");
  const { t } = useI18n();

  const handleDelete = async () => {
    const fd = new FormData();
    fd.set("commentId", String(comment.id));
    fd.set("password", deletePassword);
    fd.set("slug", slug);
    const result = await deleteComment(fd);
    if (result?.error) { setError(result.error); } else { setShowDeleteForm(false); }
  };

  if (comment.isDeleted) {
    return (
      <div className={`py-4 ${isReply ? "ml-8" : ""}`}>
        <p className="text-sm text-text-secondary italic">{t("comment.deleted")}</p>
      </div>
    );
  }

  return (
    <div className={`py-4 ${isReply ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-sm">{comment.nickname}</span>
        <span className="text-xs text-text-secondary">{new Date(comment.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      <div className="flex gap-3 mt-2">
        {!isReply && (
          <button onClick={() => onReply(comment.id)} className="text-xs text-text-secondary hover:text-accent">{t("comment.reply")}</button>
        )}
        <button onClick={() => setShowDeleteForm(!showDeleteForm)} className="text-xs text-text-secondary hover:text-red-500">{t("comment.delete")}</button>
      </div>
      {showDeleteForm && (
        <div className="flex gap-2 mt-2">
          <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder={t("comment.confirmDelete")} className="px-3 py-1.5 text-sm border border-border rounded-lg bg-bg-primary" />
          <button onClick={handleDelete} className="px-3 py-1.5 text-sm text-red-500 border border-red-500 rounded-lg hover:bg-red-50">{t("comment.delete")}</button>
          {error && <span className="text-xs text-red-500 self-center">{error}</span>}
        </div>
      )}
    </div>
  );
}
