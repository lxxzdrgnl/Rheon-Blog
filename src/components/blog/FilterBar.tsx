"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { usePathname } from "next/navigation";
import { useLocalized } from "@/i18n/provider";

interface Category { id: number; parentId?: number | null; name: string; nameEn: string; slug: string; }
interface Tag { id: number; name: string; nameEn: string; }

const CountBadge = ({ n }: { n: number }) => (
  <span className="text-xs font-semibold tabular-nums opacity-80">{n}</span>
);

export function FilterBar({
  categories,
  tags,
  counts,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  tags: Tag[];
  /** 카테고리 id별 직접 글 수 (선택). 하위 카테고리 글까지 합산해 표시. */
  counts?: Record<number, number>;
  /** 필터 모드: 선택된 카테고리 id (null = 전체). onSelect와 함께 쓰면 링크 대신 인플레이스 필터. */
  selectedId?: number | null;
  onSelect?: (cat: { id: number; slug: string } | null) => void;
}) {
  const pathname = usePathname();
  const localized = useLocalized();
  const filterMode = typeof onSelect === "function";

  const topLevel = categories.filter((c) => !c.parentId);

  // 카테고리 + 모든 하위 카테고리 글 수 합산
  const countFor = (catId: number): number => {
    let n = counts?.[catId] ?? 0;
    for (const c of categories) if (c.parentId === catId) n += countFor(c.id);
    return n;
  };
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  // 필터 모드 활성 판정: 선택값이 해당 카테고리이거나 그 하위일 때 상위도 활성
  const isAncestorOrSelf = (catId: number) => {
    let cur: number | null | undefined = selectedId;
    while (cur != null) {
      if (cur === catId) return true;
      cur = categories.find((c) => c.id === cur)?.parentId ?? null;
    }
    return false;
  };

  const base = "px-3 py-1 rounded-md text-sm transition-colors inline-flex items-center gap-1";
  const on = "bg-accent text-bg-primary font-medium";
  const off = "text-text-secondary hover:text-accent hover:bg-bg-elevated";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* All */}
      {filterMode ? (
        <button type="button" onClick={() => onSelect!(null)} className={`${base} ${selectedId == null ? on : off}`}>
          All
          {counts && <CountBadge n={total} />}
        </button>
      ) : (
        <Link href="/posts" className={`${base} ${pathname === "/posts" ? on : off}`}>
          All
          {counts && <CountBadge n={total} />}
        </Link>
      )}

      {topLevel.map((cat) => {
        const children = categories.filter((c) => c.parentId === cat.id);
        const active = filterMode
          ? isAncestorOrSelf(cat.id)
          : pathname === `/category/${cat.slug}` || children.some((c) => pathname === `/category/${c.slug}`);

        const label = (
          <>
            {localized(cat.name, cat.nameEn)}
            {counts && <CountBadge n={countFor(cat.id)} />}
            {children.length > 0 && (
              <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </>
        );

        return (
          <div key={cat.id} className="relative group">
            {filterMode ? (
              <button type="button" onClick={() => onSelect!({ id: cat.id, slug: cat.slug })} className={`${base} ${active ? on : off}`}>
                {label}
              </button>
            ) : (
              <Link href={`/category/${cat.slug}`} className={`${base} ${active ? on : off}`}>
                {label}
              </Link>
            )}

            {/* Dropdown for children */}
            {children.length > 0 && (
              // 트리거 기준 좌상단에서 스케일되며 열림. 터치 폭에서는 숨기고 부모 링크로 이동
              <div className="absolute top-full left-0 mt-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg opacity-0 invisible scale-95 origin-top-left transition-[opacity,transform,visibility] duration-150 ease-out group-hover:opacity-100 group-hover:visible group-hover:scale-100 z-20 min-w-[160px] max-[1024px]:hidden">
                {children.map((child) => {
                  const grandChildren = categories.filter((c) => c.parentId === child.id);
                  const childActive = filterMode ? isAncestorOrSelf(child.id) : pathname === `/category/${child.slug}`;
                  const childCls = `px-3 py-1.5 text-xs transition-colors flex items-center justify-between w-full text-left ${
                    childActive ? "text-accent font-medium" : "text-text-secondary hover:text-accent hover:bg-bg-elevated"
                  }`;
                  const childLabel = (
                    <>
                      <span className="inline-flex items-center gap-1">
                        {localized(child.name, child.nameEn)}
                        {counts && <CountBadge n={countFor(child.id)} />}
                      </span>
                      {grandChildren.length > 0 && (
                        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </>
                  );
                  return (
                    <div key={child.id} className="relative group/sub">
                      {filterMode ? (
                        <button type="button" onClick={() => onSelect!({ id: child.id, slug: child.slug })} className={childCls}>
                          {childLabel}
                        </button>
                      ) : (
                        <Link href={`/category/${child.slug}`} className={childCls}>
                          {childLabel}
                        </Link>
                      )}
                      {/* Sub-dropdown */}
                      {grandChildren.length > 0 && (
                        // 트리거 기준 좌상단에서 스케일되며 열림. 터치 폭에서는 숨기고 부모 링크로 이동
                        <div className="absolute left-full top-0 ml-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg opacity-0 invisible scale-95 origin-top-left transition-[opacity,transform,visibility] duration-150 ease-out group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:scale-100 z-30 min-w-[140px] max-[1024px]:hidden">
                          {grandChildren.map((gc) => {
                            const gcActive = filterMode ? selectedId === gc.id : pathname === `/category/${gc.slug}`;
                            const gcCls = `px-3 py-1.5 text-xs transition-colors flex items-center gap-1 w-full text-left ${
                              gcActive ? "text-accent font-medium" : "text-text-secondary hover:text-accent hover:bg-bg-elevated"
                            }`;
                            const gcLabel = (
                              <>
                                {localized(gc.name, gc.nameEn)}
                                {counts && <CountBadge n={countFor(gc.id)} />}
                              </>
                            );
                            return filterMode ? (
                              <button key={gc.id} type="button" onClick={() => onSelect!({ id: gc.id, slug: gc.slug })} className={gcCls}>
                                {gcLabel}
                              </button>
                            ) : (
                              <Link key={gc.id} href={`/category/${gc.slug}`} className={gcCls}>
                                {gcLabel}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
