# 004 — 모달·모바일 메뉴 진입 트랜지션 부여

- **Status**: TODO
- **Commit**: dbea070
- **Severity**: MEDIUM
- **Category**: 중단가능성(4), 물성·기점(3), 놓친 기회(8)
- **Estimated scope**: 2 파일, ~15줄

## Problem

이 컴포넌트들은 조건부 렌더링만으로 열고 닫혀서 진입/퇴장 메커니즘이 **아예 없다**. 0ms로 뚝 나타났다 뚝 사라진다.

```tsx
/* src/components/ui/ConfirmModal.tsx:26 — current */
if (!open) return null;
```
```tsx
/* src/components/ui/ConfirmModal.tsx:37-41 — current */
<div
  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
  onClick={() => !saving && onClose()}
>
  <div className={containerClass} onClick={(e) => e.stopPropagation()}>
```

```tsx
/* src/components/layout/MobileMenu.tsx:18 — current */
<div className="md:hidden absolute top-full inset-x-0 z-50 border-t border-border bg-bg-primary shadow-lg px-6 py-5 space-y-2 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
```
모바일 메뉴는 헤더 우측 상단 햄버거 버튼에서 열리는데, 헤더 아래에 순간이동하듯 나타난다. 트리거와의 공간적 연결을 설명하는 모션이 전혀 없다. 이 감사에서 **가장 아까운 지점**이다.

저장소 전체에 `@starting-style`도 `data-mounted` 패턴도 0건이다(확인함).

## Target

CSS `@starting-style`을 쓴다. JS 상태(`useState`+`useEffect`로 mounted 토글) 없이 진입 애니메이션이 가능하고, 트랜지션 기반이라 중단·역전이 자연스럽다. Next.js 16이 타깃하는 최신 브라우저에서 지원되며, 미지원 브라우저에서는 애니메이션 없이 즉시 나타난다(현재 동작과 동일 = 안전한 폴백).

**주의: 이 계획은 진입(enter)만 다룬다.** 퇴장(exit) 애니메이션은 언마운트를 지연시켜야 해서 상태 관리가 필요하고, 범위 밖이다. 진입만으로도 "뚝 끊긴다"는 인상은 대부분 사라진다.

```tsx
/* target — src/components/ui/ConfirmModal.tsx:37 */
<div
  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm modal-backdrop"
  onClick={() => !saving && onClose()}
>
  <div className={`${containerClass} modal-panel`} onClick={(e) => e.stopPropagation()}>
```

```tsx
/* target — src/components/layout/MobileMenu.tsx:18 */
<div className="md:hidden absolute top-full inset-x-0 z-50 border-t border-border bg-bg-primary shadow-lg px-6 py-5 space-y-2 max-h-[calc(100vh-3.5rem)] overflow-y-auto mobile-menu-panel">
```

```css
/* target — src/app/globals.css 맨 끝에 추가.
   단, @media (prefers-reduced-motion: reduce) 블록보다 앞에 둘 것 */

/* ─── Entry transitions ─── */
.modal-backdrop {
  opacity: 1;
  transition: opacity 200ms ease-out;
  @starting-style { opacity: 0; }
}
.modal-panel {
  opacity: 1;
  transform: scale(1);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
  /* 중앙 정렬 모달이므로 기점은 center가 맞다 — 트리거에 앵커되지 않는다 */
  @starting-style {
    opacity: 0;
    transform: scale(0.96);
  }
}
.mobile-menu-panel {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
  @starting-style {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* reduced-motion에서는 이동·스케일 제거, 페이드만 */
@media (prefers-reduced-motion: reduce) {
  .modal-panel, .mobile-menu-panel {
    transition: opacity 200ms ease;
  }
  .modal-panel { @starting-style { transform: none; } }
  .mobile-menu-panel { @starting-style { transform: none; } }
}
```

`scale(0.96)`·`translateY(-8px)`가 하한이다. **`scale(0)`이나 큰 이동값을 쓰지 말 것** — 현실의 물체는 무에서 나타나지 않는다.

## Repo conventions to follow

- 전역 재사용 CSS 클래스는 `src/app/globals.css`에 정의하고 컴포넌트에서 클래스명으로 참조한다. 기존 예시: `.card-hover`(`globals.css:255`)를 `src/components/blog/ProjectCard.tsx:48`에서 씀. `.animate-fade-in`도 같은 패턴.
- 섹션 주석 형식: `/* ─── Transitions ─── */`
- 주석은 한국어로 단다.

## Steps

1. `src/app/globals.css` 맨 끝, **`@media (prefers-reduced-motion: reduce)` 블록보다 앞에** Target의 `/* ─── Entry transitions ─── */` 블록(`.modal-backdrop`, `.modal-panel`, `.mobile-menu-panel`)을 추가한다.
2. 같은 파일의 기존 `@media (prefers-reduced-motion: reduce)` 블록 **안에** Target의 reduced-motion 규칙을 추가한다. 블록이 없으면(계획 001이 아직 실행 안 됨) Target의 `@media (prefers-reduced-motion: reduce) { ... }` 블록을 통째로 파일 끝에 추가한다.
3. `src/components/ui/ConfirmModal.tsx:37`의 배경 `div`에 `modal-backdrop` 클래스를 추가한다.
4. 같은 파일 41행의 패널 `div`에서 `className={containerClass}`를 `` className={`${containerClass} modal-panel`} ``로 바꾼다.
5. `src/components/layout/MobileMenu.tsx:18`의 `div` className 끝에 `mobile-menu-panel`을 추가한다.

## Boundaries

- **`src/app/globals.css`, `src/components/ui/ConfirmModal.tsx`, `src/components/layout/MobileMenu.tsx` 세 파일만 수정한다.**
- **`globals.css`의 기존 내용을 수정하지 말 것** — 추가만 한다. `.card-hover`, `.animate-fade-in`, `a, button` 규칙은 계획 001 담당이다. 이 계획은 파일 끝에 새 블록을 붙일 뿐이다.
- **퇴장(exit) 애니메이션을 구현하지 말 것.** `useState`/`useEffect`로 언마운트를 지연시키지 않는다. 진입만이다.
- `TranslationOverlay.tsx`와 `SeriesTableOfContents.tsx`는 이 계획 범위 밖이다(각각 오버레이 특성·높이 애니메이션이라 별도 처리 필요).
- `scale(0)` 금지. 하한은 `scale(0.96)`.
- 마크업 구조 변경 금지 — 클래스 추가만.
- 새 의존성 추가 금지.
- 스텝의 코드가 실제 파일과 다르면 임의로 고치지 말고 멈추고 보고할 것.

## Verification

- **Mechanical**: `npm run build` → 성공. `npx tsc --noEmit` → 신규 에러 0.
- **Feel check**: `npm run dev`
  - 모바일 폭(DevTools 기기 에뮬레이션)에서 `http://localhost:3000/ko` → 햄버거 버튼 탭: 메뉴가 위에서 살짝 내려오며 페이드인해야 한다. 순간이동하면 `@starting-style`이 안 걸린 것.
  - DevTools Animations 패널에서 재생 10%로 낮추고 다시 열어본다: 투명도와 이동이 동시에 진행되고 초반이 빨라야 한다(ease-out).
  - 관리자 페이지(`/my/posts`)에서 삭제 버튼을 눌러 ConfirmModal을 띄운다: 배경이 페이드인되고 패널이 아주 살짝 커지며 나타나야 한다. 확 튀어나오면 scale 값이 과한 것.
  - 모달을 빠르게 여닫아 본다: 진입이 매번 처음부터 재생되되 깨지거나 깜빡이지 않아야 한다.
  - DevTools Rendering → `prefers-reduced-motion: reduce` 켜고 다시 열기: 이동·스케일 없이 페이드만 있어야 한다.
- **Done when**: 모바일 메뉴와 모달이 진입 트랜지션을 갖고, reduced-motion에서는 페이드만 남는다.
