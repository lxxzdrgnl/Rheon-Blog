import Link from "next/link";

interface Post {
  id: number;
  title: string;
  isPublished: boolean;
  isPrivate: boolean;
  viewCount: number;
  createdAt: string;
}

export function PostTable({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-text-tertiary">아직 작성된 글이 없습니다</p>
        <Link href="/my/write" className="text-xs text-accent mt-2 inline-block hover:underline">
          첫 글을 작성해보세요 &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50 bg-bg-card">
            <th className="text-left text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider">제목</th>
            <th className="text-left text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider hidden md:table-cell">상태</th>
            <th className="text-right text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider hidden md:table-cell">조회수</th>
            <th className="text-right text-xs text-text-tertiary font-medium px-4 py-2.5 uppercase tracking-wider">날짜</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-border/30 last:border-b-0 hover:bg-bg-card/50 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/my/write?id=${post.id}`} className="text-sm font-medium hover:underline underline-offset-2">
                  {post.title}
                </Link>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  post.isPublished
                    ? post.isPrivate
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-bg-elevated text-text-tertiary"
                }`}>
                  {post.isPublished ? (post.isPrivate ? "비공개" : "발행") : "임시"}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-xs text-text-tertiary hidden md:table-cell">
                {post.viewCount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-xs text-text-tertiary">
                {new Date(post.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
