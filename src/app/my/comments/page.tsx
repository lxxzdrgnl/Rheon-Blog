import { getRecentComments } from "@/actions/comments";
import { AdminCommentList } from "@/components/admin/AdminCommentList";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const comments = await getRecentComments(200);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">댓글</h1>
        <p className="text-xs text-text-tertiary mt-1">전체 글의 댓글을 관리하고 운영자 답글을 남기세요</p>
      </div>
      <AdminCommentList initial={comments} />
    </div>
  );
}
