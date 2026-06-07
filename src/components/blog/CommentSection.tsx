"use client";

import { useState, useEffect } from "react";
import { getComments } from "@/actions/comments";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import { useI18n } from "@/i18n/provider";

interface Comment {
  id: number; postId: number; parentId: number | null; nickname: string; password: string; content: string; createdAt: string; isDeleted: boolean; isOwner: boolean;
}

export function CommentSection({ postId, slug }: { postId: number; slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const { t } = useI18n();

  const loadComments = () => getComments(postId).then(setComments);
  useEffect(() => { loadComments(); }, [postId]);

  const afterReply = () => { setReplyTo(null); loadComments(); };

  const topLevel = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">{t("comment.title")} ({comments.length})</h3>
      <div className="divide-y divide-border">
        {topLevel.map((comment) => (
          <div key={comment.id}>
            <CommentItem comment={comment} slug={slug} onReply={(id) => setReplyTo(id)} onDeleted={loadComments} />
            {replies.filter((r) => r.parentId === comment.id).map((reply) => (
              <CommentItem key={reply.id} comment={reply} slug={slug} onReply={() => setReplyTo(comment.id)} onDeleted={loadComments} isReply />
            ))}
            {replyTo === comment.id && (
              <div className="ml-8 mb-4">
                <CommentForm postId={postId} slug={slug} parentId={comment.id} onSubmitted={afterReply} onCancel={() => setReplyTo(null)} compact />
              </div>
            )}
          </div>
        ))}
      </div>
      <CommentForm postId={postId} slug={slug} onSubmitted={loadComments} />
    </div>
  );
}
