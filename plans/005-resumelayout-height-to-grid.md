# 005 — 아코디언 height 애니메이션을 컴포지터 친화 방식으로

- **Status**: TODO
- **Commit**: dbea070
- **Severity**: MEDIUM
- **Category**: 성능(5)
- **Estimated scope**: 1 파일 (`src/components/blog/ResumeLayout.tsx`), ~10줄

## Problem

```tsx
/* src/components/blog/ResumeLayout.tsx:270-290 — current */
<AnimatePresence initial={false}>
  {selectedTechs.size > 0 && (
    <motion.div
      key="clear-filters"
      initial={{ height: 0 }}
      animate={{ height: "auto" }}
      exit={{ height: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ overflow: "hidden" }}
      className="!mt-0"
    >
```

홈에서 기술 스택 필터 칩을 선택할 때마다 "필터 초기화" 버튼 영역이 `height: 0 → auto`로 애니메이션된다. `height`는 레이아웃 → 페인트 → 합성 전 단계를 매 프레임 트리거하는 속성이다. `transform`/`opacity`만 애니메이션해야 GPU에서 처리된다.

이건 `motion`을 쓰는 유일한 컴포넌트에서 발생하며, 필터 조작은 홈에서 자주 일어난다.

## Target

`grid-template-rows: 0fr → 1fr` 기법을 쓴다. `height: auto`를 애니메이션하는 표준 CSS 대안으로, 콘텐츠 높이를 미리 알 필요가 없다.

**단, 솔직히 말해 `grid-template-rows`도 레이아웃을 트리거한다.** `height`보다 나은 점은 (a) Framer Motion의 JS 기반 height 측정·매 프레임 스타일 쓰기를 제거하고 (b) 순수 CSS 트랜지션이라 메인 스레드 밖에서 돌며 (c) 중단·역전이 자연스럽다는 것이다. 진짜 컴포지터 전용으로 가려면 `transform: scaleY()`를 써야 하지만 그러면 내용물이 찌그러진다 — 버튼 하나짜리 영역에는 과한 트레이드오프다.

```tsx
/* target — src/components/blog/ResumeLayout.tsx:270-290 자리.
   AnimatePresence와 motion.div를 걷어내고 순수 CSS 그리드 트랜지션으로 대체 */
<div
  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
    selectedTechs.size > 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
  }`}
>
  <div className="overflow-hidden !mt-0">
    {/* 기존 motion.div 안에 있던 자식들을 그대로 여기로 옮긴다 */}
  </div>
</div>
```

reduced-motion 대응(계획 002가 이 파일에 `const reduceMotion = useReducedMotion();`을 이미 추가했다면 그걸 재사용):

```tsx
className={`grid ${reduceMotion ? "" : "transition-[grid-template-rows] duration-300 ease-out"} ${
  selectedTechs.size > 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
}`}
```

## Repo conventions to follow

- Tailwind 임의 값 문법을 쓴다: `grid-rows-[1fr]`, `transition-[grid-template-rows]`. 기존 예시: `src/components/layout/MobileMenu.tsx:18` — `max-h-[calc(100vh-3.5rem)]`.
- `motion/react`는 이 파일에서만 쓰인다. 이 계획으로 `AnimatePresence` 사용처가 하나 줄지만, **같은 파일 299행의 `motion.div layout`은 그대로 남으므로 import는 유지해야 한다**.
- 주석은 한국어로 단다.

## Steps

1. `src/components/blog/ResumeLayout.tsx:270-290`을 읽고 `motion.div` **안에 있던 자식 요소 전체를 정확히 파악한다**(필터 초기화 버튼 등).
2. `<AnimatePresence initial={false}>`부터 그 닫는 태그까지를 Target의 grid 구조로 교체한다. 자식 요소는 `<div className="overflow-hidden !mt-0">` 안에 그대로 옮긴다. **자식의 마크업·클래스·핸들러를 변경하지 말 것** — 위치만 옮긴다.
3. 조건부 렌더(`{selectedTechs.size > 0 && (...)}`)를 제거한다 — grid 방식은 요소가 항상 DOM에 있고 행 높이만 0fr↔1fr로 바뀐다. **주의: 그러면 필터가 없을 때도 버튼이 DOM에 존재하므로 스크린리더가 읽을 수 있다.** 이를 막기 위해 안쪽 `div`에 `aria-hidden={selectedTechs.size === 0}`을 추가하고, 버튼 자체에는 `tabIndex={selectedTechs.size > 0 ? 0 : -1}`을 준다.
4. 파일 상단 import에서 `AnimatePresence`가 더 이상 쓰이지 않으면 제거한다. **`motion`은 299행에서 계속 쓰이므로 남긴다.** 실제로 `AnimatePresence`가 파일 내 다른 곳에서도 쓰이는지 grep으로 확인한 뒤 판단할 것.
5. 파일에 `const reduceMotion = useReducedMotion();`이 이미 있으면(계획 002 실행 후) Target의 reduced-motion 버전 className을 쓴다. 없으면 기본 버전을 쓴다.

## Boundaries

- **`src/components/blog/ResumeLayout.tsx` 한 파일만 수정한다.**
- **299행의 `motion.div layout` 애니메이션은 건드리지 말 것.** 이 계획은 270-290행의 아코디언만 다룬다.
- `motion.div` 안에 있던 자식 요소의 마크업·클래스·이벤트 핸들러를 바꾸지 말 것 — 위치만 옮긴다.
- 새 의존성 추가 금지.
- 스텝의 코드가 실제 파일과 다르면 임의로 고치지 말고 멈추고 보고할 것.

## Verification

- **Mechanical**: `npx tsc --noEmit` → 신규 에러 0. `npm run build` → 성공.
- **Feel check**: `npm run dev` 후 `http://localhost:3000/ko`
  - 홈의 기술 스택 필터 칩을 클릭: "필터 초기화" 버튼 영역이 이전과 똑같이 부드럽게 펼쳐져야 한다. 툭 튀어나오면 트랜지션이 안 걸린 것.
  - 칩을 다시 눌러 해제: 영역이 부드럽게 접혀야 한다.
  - **칩을 빠르게 연타**: 펼침/접힘이 현재 높이에서 자연스럽게 역전돼야 한다(CSS 트랜지션의 이점). 처음부터 다시 재생되거나 튀면 안 된다.
  - DevTools Performance 패널에서 녹화하며 칩을 토글: 프레임 드랍이 없어야 한다.
  - 필터가 하나도 없는 상태에서 Tab 키로 이동: "필터 초기화" 버튼에 포커스가 가지 않아야 한다(`tabIndex={-1}` 확인).
  - DevTools Rendering → `prefers-reduced-motion: reduce` 켜고 칩 클릭: 애니메이션 없이 즉시 나타나야 한다(계획 002 실행 후에만 해당).
- **Done when**: 아코디언이 CSS 트랜지션으로 동작하고, 연타 시 중단·역전이 자연스러우며, 숨김 상태에서 키보드 포커스를 받지 않는다.
