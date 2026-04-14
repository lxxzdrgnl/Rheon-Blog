import Link from "next/link";
import { getPosts } from "@/actions/posts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function DashboardPage() {
  const allPosts = await getPosts();
  const published = allPosts.filter((p) => p.isPublished);
  const drafts = allPosts.filter((p) => !p.isPublished);
  const totalViews = allPosts.reduce((sum, p) => sum + p.viewCount, 0);

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/my/settings">
            <Button variant="outlined">설정</Button>
          </Link>
          <Link href="/my/write">
            <Button>새 글 작성</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Card variant="filled" className="p-6">
          <p className="text-sm text-text-secondary">발행된 글</p>
          <p className="text-3xl font-bold mt-1">{published.length}</p>
        </Card>
        <Card variant="filled" className="p-6">
          <p className="text-sm text-text-secondary">임시저장</p>
          <p className="text-3xl font-bold mt-1">{drafts.length}</p>
        </Card>
        <Card variant="filled" className="p-6">
          <p className="text-sm text-text-secondary">총 조회수</p>
          <p className="text-3xl font-bold mt-1">{totalViews.toLocaleString()}</p>
        </Card>
      </div>

      <h2 className="text-lg font-bold mb-4">모든 글</h2>
      <div className="space-y-3">
        {allPosts.map((post) => (
          <Card key={post.id} className="p-4 flex items-center justify-between">
            <div>
              <Link href={`/my/write?id=${post.id}`} className="font-medium hover:text-accent transition-colors">
                {post.title}
              </Link>
              <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                <span>{post.isPublished ? "발행됨" : "임시저장"}</span>
                <span>조회수 {post.viewCount}</span>
                <span>{post.createdAt}</span>
              </div>
            </div>
          </Card>
        ))}
        {allPosts.length === 0 && (
          <p className="text-text-secondary text-sm">아직 작성된 글이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
