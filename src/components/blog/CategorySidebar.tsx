"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useI18n, useLocalized } from "@/i18n/provider";
import { SiteViewStats } from "./SiteViewStats";

interface CatNode {
  id: number;
  parentId: number | null;
  name: string;
  nameEn: string;
  slug: string;
  postCount?: number;
  children: CatNode[];
}

interface RecentPost { id: number; title: string; titleEn: string | null; slug: string; createdAt: string }

const fmtDate = (s: string) => {
  const d = new Date(s);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

const CountBadge = ({ n }: { n: number }) => (
  <span className="ml-1 text-xs font-normal opacity-50 tabular-nums">{n}</span>
);

/**
 * 포스트·프로젝트 상세 왼쪽 분류 트리 (우측 TOC의 반대편).
 * xl 이상에서만 표시, 본문과 함께 스크롤(absolute). 클릭 시 /posts?cat=slug 로 필터 선택 상태 이동.
 */
export function CategorySidebar({
  tree,
  counts,
  recentPosts,
  viewStats,
  activeSlug,
}: {
  tree: CatNode[];
  counts?: Record<number, number>;
  recentPosts?: RecentPost[];
  viewStats?: { total: number; today: number };
  activeSlug?: string;
}) {
  const { locale } = useI18n();
  const localized = useLocalized();

  const countFor = (node: CatNode): number =>
    (counts?.[node.id] ?? 0) + node.children.reduce((s, c) => s + countFor(c), 0);

  return (
    <nav
      className="hidden xl:block absolute top-10 w-52 animate-fade-in animate-delay-1"
      style={{ right: "calc(50% + var(--max-width-prose) / 2 + 2rem)" }}
    >
      {viewStats && <SiteViewStats total={viewStats.total} today={viewStats.today} />}

      <Link href="/posts" className={`block text-sm font-bold mb-3 hover:text-accent transition-colors ${viewStats ? "mt-8" : ""}`}>
        {locale === "en" ? "All Categories" : "분류 전체보기"}
      </Link>
      <ul className="space-y-0.5">
        {tree.map((node) => (
          <CatItem key={node.id} node={node} depth={0} countFor={countFor} hasCounts={!!counts} activeSlug={activeSlug} />
        ))}
      </ul>

      {recentPosts && recentPosts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-sm font-bold">{locale === "en" ? "Latest" : "최신글"}</p>
            <Link href="/posts" className="text-[11px] text-text-tertiary hover:text-accent transition-colors">
              {locale === "en" ? "More" : "더보기"}
            </Link>
          </div>
          <ul className="space-y-2.5">
            {recentPosts.map((p) => (
              <li key={p.id}>
                <Link href={`/post/${p.slug}`} className="group block">
                  <span className="block text-[13px] text-text-secondary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                    {localized(p.title, p.titleEn)}
                  </span>
                  <span className="block text-[11px] text-text-tertiary tabular-nums mt-0.5">{fmtDate(p.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

function CatItem({
  node,
  depth,
  countFor,
  hasCounts,
  activeSlug,
}: {
  node: CatNode;
  depth: number;
  countFor: (n: CatNode) => number;
  hasCounts: boolean;
  activeSlug?: string;
}) {
  const localized = useLocalized();
  const active = activeSlug === node.slug;

  return (
    <li>
      <Link
        href={`/posts?cat=${node.slug}`}
        className={`block py-1 text-sm truncate transition-colors ${depth === 0 ? "font-semibold" : ""} ${
          active ? "text-accent" : depth === 0 ? "text-text-primary hover:text-accent" : "text-text-tertiary hover:text-accent"
        }`}
      >
        {localized(node.name, node.nameEn)}
        {hasCounts && <CountBadge n={countFor(node)} />}
      </Link>
      {node.children.length > 0 && (
        <ul className="ml-1.5 pl-2.5 border-l border-border space-y-0.5">
          {node.children.map((child) => (
            <CatItem key={child.id} node={child} depth={depth + 1} countFor={countFor} hasCounts={hasCounts} activeSlug={activeSlug} />
          ))}
        </ul>
      )}
    </li>
  );
}
