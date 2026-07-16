# 003 — 카테고리 드롭다운: 기점·물성 부여 + 터치 대응

- **Status**: TODO
- **Commit**: dbea070
- **Severity**: MEDIUM
- **Category**: 물성·기점(3), 성능(5), 접근성(6)
- **Estimated scope**: 1 파일 (`src/components/blog/FilterBar.tsx`), ~10줄

## Problem

```tsx
/* src/components/blog/FilterBar.tsx:104 — current */
<div className="absolute top-full left-0 mt-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[160px]">
```
(`:137`에도 서브 드롭다운에 사실상 동일한 클래스 문자열이 있다.)

세 가지 문제가 겹쳐 있다.

1. **기점 없음**: `transform`이 전혀 없어 순수 페이드로 나타난다. 트리거(부모 카테고리 버튼)에서 나온다는 공간적 연결을 설명하는 모션이 없다. 드롭다운은 트리거에서 스케일되며 나와야 자연스럽다.
2. **`transition: all`**: 성능상 명시적 속성으로 좁혀야 한다.
3. **터치 실패**: `group-hover`만으로 열리고 `(hover: hover) and (pointer: fine)` 게이팅이 없다. 터치 기기에서는 탭이 hover로 해석되지 않아 안 열리거나, 열린 채 고착되는 두 실패 모드 중 하나가 발생한다.

**중요**: 3번을 CSS만으로 완전히 해결할 수는 없다(클릭으로 여는 상태 관리가 필요). 이 계획은 **CSS 범위 안에서만** 다룬다 — hover 드롭다운을 `(hover: hover) and (pointer: fine)`로 게이팅하고, 터치에서는 드롭다운 대신 부모 카테고리 링크가 그대로 동작하게 둔다. 클릭 기반 드롭다운으로 재작성하는 것은 이 계획의 범위 밖이며, 상태 관리·외부 클릭 감지·키보드 접근성까지 필요해 별도 작업이어야 한다.

## Target

```tsx
/* target — FilterBar.tsx:104 및 :137 두 곳 모두 동일 패턴 */
<div className="absolute top-full left-0 mt-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg opacity-0 invisible scale-95 origin-top-left transition-[opacity,transform,visibility] duration-150 ease-out group-hover:opacity-100 group-hover:visible group-hover:scale-100 z-20 min-w-[160px] max-[1024px]:hidden">
```

바뀌는 것:
- `scale-95` + `group-hover:scale-100` 추가 → 트리거에서 살짝 커지며 나옴. **`scale-0`은 절대 쓰지 말 것** — 현실의 물체는 무에서 나타나지 않는다. 0.95가 하한이다.
- `origin-top-left` 추가 → 드롭다운이 `left-0 top-full`에 붙어 있으므로 기점은 좌상단이다.
- `transition-all` → `transition-[opacity,transform,visibility]`로 명시.
- `duration-150 ease-out` 명시 → 드롭다운 예산은 150~250ms, 진입이므로 ease-out.
- `max-[1024px]:hidden` → 터치·태블릿 폭에서 드롭다운 자체를 숨김(부모 카테고리 링크는 그대로 클릭 가능).

`:137`의 서브 드롭다운은 위치와 group 스코프가 다르다. 현재 코드는 이렇다:

```tsx
/* src/components/blog/FilterBar.tsx:137 — current */
<div className="absolute left-full top-0 ml-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all z-30 min-w-[140px]">
```

`left-full top-0`이라 부모 항목의 **오른쪽**으로 펼쳐진다. 따라서 기점은 좌상단(`origin-top-left`)이 맞다 — 부모와 맞닿는 모서리다. group 스코프가 `group-hover/sub`인 점에 주의(`group-hover`가 아님).

```tsx
/* target — FilterBar.tsx:137 */
<div className="absolute left-full top-0 ml-1 py-1 bg-bg-primary border border-border rounded-lg shadow-lg opacity-0 invisible scale-95 origin-top-left transition-[opacity,transform,visibility] duration-150 ease-out group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:scale-100 z-30 min-w-[140px] max-[1024px]:hidden">
```

## Repo conventions to follow

- Tailwind 유틸리티 클래스를 인라인 `className` 문자열로 쓴다. 별도 CSS 파일을 만들지 않는다.
- 지속시간은 Tailwind 유틸(`duration-150`)로 쓴다. 기존 예시: `src/components/blog/ResumeLayout.tsx:258` — `transition-colors duration-150`.
- 계획 001이 `--ease-out` 토큰을 `@theme`에 추가한다. **이 계획은 그 토큰에 의존하지 않는다** — Tailwind 기본 `ease-out`(`cubic-bezier(0, 0, 0.2, 1)`)을 쓴다. 001과 독립적으로 실행 가능해야 하기 때문이다.

## Steps

1. `src/components/blog/FilterBar.tsx:104`의 드롭다운 `className`을 Target 버전으로 교체한다.
2. `src/components/blog/FilterBar.tsx:137`의 서브 드롭다운 `className`을 위 Target 버전으로 교체한다. **group 스코프가 `group-hover/sub`이므로 `group-hover/sub:scale-100`을 써야 한다** — `group-hover:scale-100`으로 쓰면 동작하지 않는다.
3. 두 곳 모두 `// 트리거 기준 좌상단에서 스케일되며 열림. 터치 폭에서는 숨기고 부모 링크로 이동` 같은 한국어 주석을 남긴다(선택).

## Boundaries

- **`src/components/blog/FilterBar.tsx` 한 파일만 수정한다.**
- **클릭 기반 드롭다운으로 재작성하지 말 것.** 상태(`useState`)·외부 클릭 감지·키보드 핸들러를 추가하지 않는다. 이 계획은 CSS 범위다.
- 마크업 구조를 바꾸지 말 것 — `className` 문자열만 교체한다.
- `scale-0`으로 시작하지 말 것. 하한은 `scale-95`.
- 새 의존성 추가 금지.
- 스텝의 코드가 실제 파일과 다르면 임의로 고치지 말고 멈추고 보고할 것.

## Verification

- **Mechanical**: `npm run build` → 성공. `npx tsc --noEmit` → 신규 에러 0.
- **Feel check**: `npm run dev` 후 카테고리 필터가 있는 페이지(`http://localhost:3000/ko/posts`)
  - 부모 카테고리에 마우스를 올리면 드롭다운이 **좌상단 모서리에서** 살짝 커지며 열려야 한다. 중앙에서 퍼지면 `origin-*`이 틀린 것.
  - DevTools Animations 패널에서 재생 10%로 낮추고 관찰: 스케일과 투명도가 같이 움직여야 하고, 초반에 빠르게 나가야 한다(ease-out).
  - 열림이 150ms로 즉각적으로 느껴져야 한다. 굼뜨면 duration이 잘못 들어간 것.
  - DevTools 기기 에뮬레이션으로 폭 1024px 미만 + 터치로 전환: 드롭다운이 아예 안 나타나고, 부모 카테고리를 탭하면 해당 카테고리 페이지로 정상 이동해야 한다.
- **Done when**: 데스크톱에서 드롭다운이 트리거 모서리에서 스케일되며 열리고, 터치 폭에서는 드롭다운 없이 링크가 동작한다.
