"use client";

import { useState, useEffect } from "react";
import { getPortfolios, deletePortfolio, reorderPortfolios } from "@/actions/portfolios";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Portfolio {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string;
  techStack: string;
  link: string | null;
  thumbnail: string | null;
  sortOrder: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Portfolio[]>([]);

  const loadAll = () => getPortfolios().then(setProjects);
  useEffect(() => { loadAll(); }, []);

  const handleMove = async (index: number, dir: "up" | "down") => {
    const list = [...projects];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setProjects(list);
    await reorderPortfolios(list.map((p) => p.id));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deletePortfolio(id);
    loadAll();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">프로젝트</h1>
          <p className="text-xs text-text-tertiary mt-1">홈에 표시되는 프로젝트를 관리합니다</p>
        </div>
        <Link href="/my/projects/write">
          <Button>새 프로젝트</Button>
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          {projects.map((p, i) => {
            const techs: string[] = JSON.parse(p.techStack || "[]");
            return (
              <div key={p.id} className="flex items-center gap-4 p-4 border-b border-border/20 last:border-b-0 hover:bg-bg-card/30 transition-colors">
                {/* Reorder */}
                <div className="flex flex-col gap-px shrink-0">
                  <button onClick={() => handleMove(i, "up")} disabled={i === 0} className="text-xs text-text-tertiary hover:text-text-primary disabled:opacity-15 p-0.5">&#9650;</button>
                  <button onClick={() => handleMove(i, "down")} disabled={i === projects.length - 1} className="text-xs text-text-tertiary hover:text-text-primary disabled:opacity-15 p-0.5">&#9660;</button>
                </div>

                {/* Thumbnail */}
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className="w-14 h-10 object-cover rounded shrink-0" />
                ) : (
                  <div className="w-14 h-10 rounded bg-bg-elevated flex items-center justify-center shrink-0">
                    <span className="text-xs text-text-tertiary font-medium">{p.title.charAt(0)}</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{p.title}</span>
                  {techs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {techs.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 text-xs bg-bg-elevated rounded text-text-tertiary">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/projects/${p.slug}`} className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors" title="보기">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                  <Link href={`/my/projects/write?id=${p.id}`} className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors" title="수정">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </Link>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-text-tertiary hover:text-red-500 transition-colors" title="삭제">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <div className="text-text-tertiary">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm">등록된 프로젝트가 없습니다</p>
            <Link href="/my/projects/write" className="text-xs text-accent mt-2 inline-block hover:underline">
              첫 프로젝트를 추가하세요 &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
