"use client";

import { useState, useRef, useEffect } from "react";
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

  /** 터치로 연 드롭다운의 카테고리 id. hover는 CSS가 담당하고 이건 탭 전용. */
  const [openId, setOpenId] = useState<number | null>(null);
  const [openSubId, setOpenSubId] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // 바깥 탭·Escape로 닫기
  useEffect(() => {
    if (openId == null) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) { setOpenId(null); setOpenSubId(null); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenId(null); setOpenSubId(null); }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openId]);

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
    <div ref={barRef} className="flex flex-wrap items-center gap-1.5">
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
          </>
        );

        return (
          <div key={cat.id} className="relative group">
            <div className="inline-flex items-center">
              {filterMode ? (
                <button type="button" onClick={() => onSelect!({ id: cat.id, slug: cat.slug })} className={`${base} ${active ? on : off}`}>
                  {label}
                </button>
              ) : (
                <Link href={`/category/${cat.slug}`} className={`${base} ${active ? on : off}`}>
                  {label}
                </Link>
              )}
              {children.length > 0 && (
                <button
                  type="button"
                  aria-label={localized(`${cat.name} 하위 분류 펼치기`, `Show ${cat.nameEn} subcategories`)}
                  aria-expanded={openId === cat.id}
                  onClick={() => { setOpenId(openId === cat.id ? null : cat.id); setOpenSubId(null); }}
                  className={`-ml-1 px-2.5 py-2 md:px-1.5 md:py-1 rounded-md transition-colors ${active ? "text-bg-primary" : "text-text-secondary hover:text-accent"}`}
                >
                  <svg
                    className={`w-4 h-4 opacity-100 md:w-3 md:h-3 md:opacity-50 transition-transform duration-150 ${openId === cat.id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown for children */}
            {children.length > 0 && (
              // 트리거 기준 좌상단에서 스케일되며 열림. hover(데스크톱) 또는 openId 상태(터치)로 열림
              <div
                className={`absolute top-full left-0 mt-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg origin-top-left transition-[opacity,transform,visibility] duration-150 ease-out z-20 min-w-[160px] ${
                  openId === cat.id
                    ? "opacity-100 visible scale-100"
                    : "opacity-0 invisible scale-95 md:group-hover:opacity-100 md:group-hover:visible md:group-hover:scale-100"
                }`}
              >
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
                    </>
                  );
                  return (
                    <div key={child.id} className="relative group/sub">
                      <div className="inline-flex items-center w-full">
                        {filterMode ? (
                          <button type="button" onClick={() => onSelect!({ id: child.id, slug: child.slug })} className={childCls}>
                            {childLabel}
                          </button>
                        ) : (
                          <Link href={`/category/${child.slug}`} className={childCls}>
                            {childLabel}
                          </Link>
                        )}
                        {grandChildren.length > 0 && (
                          <button
                            type="button"
                            aria-label={localized(`${child.name} 하위 분류 펼치기`, `Show ${child.nameEn} subcategories`)}
                            aria-expanded={openSubId === child.id}
                            onClick={() => setOpenSubId(openSubId === child.id ? null : child.id)}
                            className="px-3 py-2.5 md:px-2 md:py-1.5 text-text-tertiary hover:text-accent transition-colors shrink-0"
                          >
                            <svg
                              className={`w-4 h-4 opacity-100 md:w-3 md:h-3 md:opacity-50 transition-transform duration-150 ${openSubId === child.id ? "rotate-90" : ""}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {/* Sub-dropdown */}
                      {grandChildren.length > 0 && (
                        // 트리거 기준 좌상단에서 스케일되며 열림(데스크톱). 좁은 화면에서는 아래로 펼침
                        <div
                          className={`absolute left-0 top-full ml-0 mt-1 md:left-full md:top-0 md:ml-1 md:mt-0 py-1 bg-bg-primary border border-border rounded-lg shadow-lg origin-top-left transition-[opacity,transform,visibility] duration-150 ease-out z-30 min-w-[140px] ${
                            openSubId === child.id
                              ? "opacity-100 visible scale-100"
                              : "opacity-0 invisible scale-95 md:group-hover/sub:opacity-100 md:group-hover/sub:visible md:group-hover/sub:scale-100"
                          }`}
                        >
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
