/**
 * 공통 UI 클래스 — 폰트/라벨을 한 곳에서 관리해 컴포넌트마다 하드코딩하지 않게 한다.
 * (literal 문자열이라 Tailwind JIT가 클래스를 정상 수집)
 *
 * ── 타입 스케일(상황별 글씨 크기) — 4단계. 새 UI는 이 표를 따른다 ─────────
 *  (주의: 이 프로젝트의 text-xs≈13px, text-sm≈15px, text-base≈17.6px — 토큰이 기본보다 큼)
 *  페이지 제목(h1)            text-2xl md:text-3xl (글 상세 md:text-4xl)
 *  ① 작은 보조(태그·칩·micro)  text-[11px]
 *  ② 라벨·스니펫·메타          EYEBROW(13) / CARD_SNIPPET(13) / text-xs(메타)
 *  ③ 본문·카드 제목            text-sm(본문·설명) / CARD_TITLE(15)
 *  ④ 큰 본문·nav              text-base
 *  → 그 외 임의 px(10·12·14 등) 새로 만들지 말 것.
 * ──────────────────────────────────────────────────────────────────
 */

/** 섹션/관련 프로젝트/시리즈/관련 포스트 등 eyebrow 라벨 공통 — 크기·굵기·대문자·자간. 색상은 사용처에서. */
export const EYEBROW = "text-[13px] font-bold uppercase tracking-wide";

/** 포스트·시리즈 카드 제목(PostCard/SeriesCard 공용). */
export const CARD_TITLE =
  "font-semibold text-[15px] text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-200";

/** 포스트·시리즈 카드 스니펫/설명(2줄). 위치 마진(mt-*)은 사용처에서. */
export const CARD_SNIPPET = "text-[13px] text-text-secondary leading-relaxed line-clamp-2";
