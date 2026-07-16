# 006 — 카테고리 드롭다운: 터치로 열기 (화살표 분리 토글)

- **Status**: TODO
- **Commit**: 003 실행 직후 기준 (`plans/003-filterbar-dropdown-origin.md`가 먼저 적용돼 있어야 함)
- **Severity**: MEDIUM
- **Category**: 접근성(6), 놓친 기회(8)
- **Estimated scope**: 1 파일 (`src/components/blog/FilterBar.tsx`), ~60줄

## Problem

계획 003이 드롭다운에 기점·물성을 주고 `max-[1024px]:hidden`으로 **좁은 화면에서는 드롭다운을 숨겼다**. 깨진 상태(터치에서 안 열리거나 열린 채 고착)를 피하는 임시방편이었고, 모바일 사용자는 하위 카테고리에 접근할 방법이 없다.

이 계획은 그 `max-[1024px]:hidden`을 걷어내고 터치로 열리게 만든다.

### 왜 단순하지 않은가

부모 칩은 이미 자기 동작이 있다. `FilterBar.tsx:92-100` 현재 구조:

```tsx
{filterMode ? (
  <button type="button" onClick={() => onSelect!({ id: cat.id, slug: cat.slug })} className={`${base} ${active ? on : off}`}>
    {label}
  </button>
) : (
  <Link href={`/category/${cat.slug}`} className={`${base} ${active ? on : off}`}>
    {label}
  </Link>
)}
```

탭 = 카테고리 선택(필터 모드) 또는 페이지 이동(링크 모드). 여기에 "탭하면 드롭다운 열기"를 얹으면 두 동작이 충돌한다. 그리고 화살표 아이콘은 현재 `label` JSX 안에 들어 있어(`:82-86`) 버튼 **안**에 있다 — 버튼 안에 버튼을 넣는 건 유효하지 않은 HTML이라 그대로는 토글로 못 쓴다.

또 하나: 손자 드롭다운이 `left-full top-0`으로 부모 오른쪽에 붙는다(`:137`). 폰 화면에서는 그대로 두면 화면 밖으로 나가서, 열어도 안 보인다.

## Target

**화살표를 별도 토글 버튼으로 분리한다.** 이름 탭 = 선택/이동(기존 그대로), 화살표 탭 = 하위 펼침. 데스크톱 hover는 그대로 유지한다.

### 화살표는 하위가 있을 때만 (현행 유지)

현재 코드가 이미 `{children.length > 0 && <svg .../>}`로 하위가 있을 때만 화살표를 렌더한다(`:82`). **이 조건을 유지한다** — 하위가 없는 카테고리에는 화살표도, 토글 버튼도 나오지 않아야 한다. 자식 항목의 화살표도 `{grandChildren.length > 0 && ...}` 조건을 그대로 유지한다.

### 터치 타깃

데스크톱에서 화살표는 hover의 보조 표시라 12px·`opacity-50`으로 충분했지만, 이 계획에서는 좁은 화면의 **유일한 탭 대상**이 된다. 12px·50% 불투명도는 누르기도 어렵고 눈에 띄지도 않는다. 그래서 모바일에서만 크게·진하게 하고, `md:` 이상에서는 기존 모습을 그대로 되돌린다(Target 코드의 `w-4 h-4 opacity-100 md:w-3 md:h-3 md:opacity-50` + `px-2.5 py-2 md:px-1.5 md:py-1`). 데스크톱 시각적 회귀가 없어야 한다.

### 상태와 훅

```tsx
// 파일 상단 import
import { useState, useRef, useEffect } from "react";

// 컴포넌트 본문, const filterMode = ... 아래
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
```

최상위 컨테이너(`:58`)에 ref를 붙인다:
```tsx
<div ref={barRef} className="flex flex-wrap items-center gap-1.5">
```

### 부모 칩: 화살표 분리

`label` JSX(`:78-88`)에서 **화살표 `<svg>` 부분을 제거한다.** `label`은 이름 + CountBadge만 남긴다:

```tsx
const label = (
  <>
    {localized(cat.name, cat.nameEn)}
    {counts && <CountBadge n={countFor(cat.id)} />}
  </>
);
```

`:91-100`의 칩 렌더를 이렇게 바꾼다:

```tsx
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
```

### 부모 드롭다운: hover(데스크톱) OR 탭(상태)

003이 만든 className에서 `max-[1024px]:hidden`을 빼고, 상태 기반 열림을 더한다:

```tsx
{children.length > 0 && (
  <div
    className={`absolute top-full left-0 mt-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg origin-top-left transition-[opacity,transform,visibility] duration-150 ease-out z-20 min-w-[160px] ${
      openId === cat.id
        ? "opacity-100 visible scale-100"
        : "opacity-0 invisible scale-95 md:group-hover:opacity-100 md:group-hover:visible md:group-hover:scale-100"
    }`}
  >
```

핵심: hover 열림을 `md:`로 게이팅해 좁은 화면에서는 hover가 관여하지 않게 한다. 열림 상태면 폭과 무관하게 열린다.

### 손자 드롭다운: 좁은 화면에서 아래로 펼침

003이 만든 `:137` className을 이렇게 바꾼다. `left-full top-0`(오른쪽)은 `md:` 이상에서만, 그 미만에서는 `left-0 top-full`(아래):

```tsx
{grandChildren.length > 0 && (
  <div
    className={`absolute left-0 top-full ml-0 mt-1 md:left-full md:top-0 md:ml-1 md:mt-0 py-1 bg-bg-primary border border-border rounded-lg shadow-lg origin-top-left transition-[opacity,transform,visibility] duration-150 ease-out z-30 min-w-[140px] ${
      openSubId === child.id
        ? "opacity-100 visible scale-100"
        : "opacity-0 invisible scale-95 md:group-hover/sub:opacity-100 md:group-hover/sub:visible md:group-hover/sub:scale-100"
    }`}
  >
```

### 자식 항목: 손자가 있으면 화살표를 토글로

`:123-133`의 `childLabel`에서 화살표 `<svg>`를 제거하고, 자식 렌더(`:125-140`)를 부모와 같은 패턴으로 바꾼다:

```tsx
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
```

`childCls`(`:107-109`)에서 `justify-between`은 유지하되 `w-full`이 있으므로 화살표가 분리된 뒤에는 `flex-1`이 필요할 수 있다 — 실제로 렌더해 보고 이름이 왼쪽에 붙어 있으면 그대로 두고, 이상하면 `childCls`의 `w-full`을 `flex-1`로 바꾼다.

## Repo conventions to follow

- `"use client"` 컴포넌트다(`:1`). 훅 사용 가능.
- 다국어는 `useLocalized()`의 `localized(ko, en)` 시그니처를 쓴다. 기존 예시: `:80` — `{localized(cat.name, cat.nameEn)}`.
- Tailwind 유틸리티를 인라인 `className`으로 쓴다. 조건부는 템플릿 리터럴 삼항. 기존 예시: `:93` — `` className={`${base} ${active ? on : off}`} ``.
- 주석은 한국어로 단다.

## Steps

1. `src/components/blog/FilterBar.tsx` 상단 import에 `import { useState, useRef, useEffect } from "react";`를 추가한다.
2. 컴포넌트 본문 `const filterMode = ...` 아래에 Target의 상태 2개·ref·`useEffect`(바깥 탭·Escape)를 추가한다.
3. `:58`의 최상위 `<div className="flex flex-wrap items-center gap-1.5">`에 `ref={barRef}`를 추가한다.
4. `label` JSX(`:78-88`)에서 화살표 `<svg>` 블록을 제거한다.
5. 부모 칩 렌더(`:91-100`)를 Target의 `inline-flex` + 분리된 화살표 토글 버튼 구조로 교체한다.
6. 부모 드롭다운 className(`:104`, 003 적용 후 상태)에서 `max-[1024px]:hidden`을 제거하고 Target의 상태 기반 삼항으로 교체한다. `group-hover:*`를 `md:group-hover:*`로 바꾸는 것을 잊지 말 것.
7. `childLabel`(`:123-133`)에서 화살표 `<svg>` 블록을 제거한다.
8. 자식 렌더를 Target의 분리된 화살표 토글 구조로 교체한다.
9. 손자 드롭다운 className(`:137`, 003 적용 후 상태)을 Target의 반응형 위치 + 상태 기반 삼항으로 교체한다. `max-[1024px]:hidden` 제거.

## Boundaries

- **`src/components/blog/FilterBar.tsx` 한 파일만 수정한다.**
- **`base`/`on`/`off`/`childCls`/`gcCls` 상수의 값을 바꾸지 말 것** — 화살표 분리로 레이아웃이 깨지지 않는 한 그대로 둔다.
- **`onSelect`/`Link href` 동작을 바꾸지 말 것.** 이름 탭은 지금과 똑같이 선택/이동해야 한다.
- 003이 넣은 `scale-95`/`origin-top-left`/`duration-150 ease-out`/`transition-[opacity,transform,visibility]`는 **유지한다.** 이 계획은 `max-[1024px]:hidden`만 걷어내고 열림 조건을 더한다.
- `scale-0` 금지. 하한은 `scale-95`.
- 새 의존성 추가 금지.
- 손자(3단)보다 깊은 중첩을 지원하려 하지 말 것 — 현재 구조가 3단까지다.
- 계획의 코드가 실제 파일과 다르면(003 드리프트) 임의로 고치지 말고 멈추고 보고할 것.

## Verification

- **Mechanical**: `npx tsc --noEmit` → 신규 에러 0(기존 `.next/types/validator.ts` 에러는 무시). `npm run build` → 성공.
- **Feel check**: `npm run dev` 후 `http://localhost:3000/ko/posts`
  - **데스크톱(마우스)**: 하위가 있는 카테고리에 마우스를 올리면 예전처럼 드롭다운이 열려야 한다(hover 회귀 없음). 화살표를 클릭해도 열린다. 다시 클릭하면 닫힌다.
  - **데스크톱**: 카테고리 **이름**을 클릭하면 드롭다운이 아니라 기존대로 선택/이동이 돼야 한다.
  - **터치(DevTools 기기 에뮬레이션, 폭 390px)**: 화살표를 탭하면 드롭다운이 열려야 한다. 이게 이 계획의 핵심 — 안 열리면 실패다.
  - **터치**: 손자가 있는 자식의 화살표를 탭하면 손자 드롭다운이 **아래로** 펼쳐지고 화면 안에 다 보여야 한다. 오른쪽으로 나가 잘리면 반응형 위치 클래스가 안 걸린 것.
  - **터치**: 드롭다운 바깥을 탭하면 닫혀야 한다. 열린 채 고착되면 실패.
  - **키보드**: Tab으로 화살표 버튼에 포커스 → Enter로 열기 → Escape로 닫기가 동작해야 한다.
  - 화살표 아이콘이 열림 상태에서 회전해야 한다(부모 180°, 자식 90°).
  - DevTools Rendering → `prefers-reduced-motion: reduce`: 드롭다운이 스케일 없이 나타나야 한다(001이 전역 처리하지 않으므로 여기선 스케일이 남을 수 있음 — 남아도 실패 아님, 관찰만 하고 보고).
- **Done when**: 폭 390px 터치 에뮬레이션에서 화살표 탭 → 하위 드롭다운 열림 → 손자까지 화면 안에서 접근 가능 → 바깥 탭으로 닫힘이 전부 동작하고, 데스크톱 hover가 회귀 없이 유지된다.
