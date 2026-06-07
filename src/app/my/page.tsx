import Link from "next/link";
import { getPosts, getPostStats } from "@/actions/posts";
import { getPortfolios } from "@/actions/portfolios";
import { getRecentComments } from "@/actions/comments";
import { Button } from "@/components/ui/Button";
import { PostTable } from "@/components/admin/PostTable";

export default async function DashboardPage() {
  const [recentPosts, stats, allProjects, recentComments] = await Promise.all([
    getPosts({ limit: 5 }),
    getPostStats(),
    getPortfolios(),
    getRecentComments(8),
  ]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">대시보드</h1>
          <p className="text-xs text-text-tertiary mt-1">블로그 현황을 한눈에 확인하세요</p>
        </div>
        <Link href="/my/write">
          <Button>새 글 작성</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "발행", value: stats.published, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "임시저장", value: stats.drafts, color: "text-amber-600 dark:text-amber-400" },
          { label: "총 조회수", value: stats.totalViews.toLocaleString(), color: "text-text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-bg-card p-5 border border-border/30">
            <p className="text-xs text-text-tertiary uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold tracking-tight">프로젝트</h2>
          <Link href="/my/projects" className="text-xs text-text-tertiary hover:text-text-primary transition-colors">
            모두 보기 &rarr;
          </Link>
        </div>
        {allProjects.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {allProjects.map((p) => {
              const techs: string[] = JSON.parse(p.techStack || "[]");
              return (
                <Link key={p.id} href={`/projects/${p.slug}`} className="shrink-0 w-56 group">
                  <div className="rounded-xl border border-border/50 overflow-hidden hover:border-border transition-colors h-full">
                    {p.thumbnail ? (
                      <div className="h-28 overflow-hidden">
                        <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="h-28 bg-bg-elevated flex items-center justify-center">
                        <span className="text-sm font-semibold text-text-tertiary">{p.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="p-3.5">
                      <h3 className="text-sm font-semibold truncate">{p.title}</h3>
                      {techs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {techs.slice(0, 3).map((t) => (
                            <span key={t} className="text-xs px-1.5 py-0.5 bg-bg-elevated rounded text-text-tertiary">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            <Link href="/my/projects" className="shrink-0 w-56">
              <div className="rounded-xl border border-dashed border-border h-full min-h-[180px] flex items-center justify-center hover:border-text-tertiary transition-colors">
                <div className="text-center text-text-tertiary">
                  <span className="text-xl leading-none">+</span>
                  <p className="text-xs mt-1">새 프로젝트</p>
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <Link href="/my/projects" className="block">
            <div className="rounded-xl border border-dashed border-border p-8 text-center hover:border-text-tertiary transition-colors">
              <span className="text-xl text-text-tertiary">+</span>
              <p className="text-xs text-text-tertiary mt-1">첫 프로젝트를 추가하세요</p>
            </div>
          </Link>
        )}
      </section>

      {/* Posts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold tracking-tight">최근 글</h2>
          <Link href="/my/posts" className="text-xs text-text-tertiary hover:text-text-primary transition-colors">
            모두 보기 &rarr;
          </Link>
        </div>
        <PostTable posts={recentPosts} />
      </section>

      {/* Comments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold tracking-tight">최근 댓글</h2>
          <Link href="/my/comments" className="text-xs text-text-tertiary hover:text-text-primary transition-colors">
            모두 보기 &rarr;
          </Link>
        </div>
        {recentComments.length > 0 ? (
          <ul className="divide-y divide-border/30 rounded-xl border border-border/30 bg-bg-card">
            {recentComments.map((c) => (
              <li key={c.id}>
                <Link href={`/post/${c.postSlug}`} className="block p-4 group hover:bg-bg-elevated/40 transition-colors">
                  <div className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                    <span className="font-medium text-text-secondary">{c.nickname}</span>
                    {c.parentId && <span className="px-1 rounded bg-bg-elevated">답글</span>}
                    <span>·</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-sm truncate ${c.isDeleted ? "italic text-text-tertiary" : "text-text-primary"}`}>
                    {c.isDeleted ? "삭제된 댓글" : c.content}
                  </p>
                  <p className="text-xs text-text-tertiary mt-1 truncate group-hover:text-text-secondary transition-colors">
                    {c.postTitle} &rarr;
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-xs text-text-tertiary">아직 댓글이 없습니다</p>
          </div>
        )}
      </section>
    </div>
  );
}
