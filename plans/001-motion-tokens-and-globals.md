# 001 — 모션 토큰 도입 + 전역 CSS 기본값 교정

- **Status**: TODO
- **Commit**: dbea070
- **Severity**: HIGH
- **Category**: 이징·지속시간(2), 성능(5), 접근성(6), 응집도·토큰(7)
- **Estimated scope**: 1 파일 (`src/app/globals.css`), ~40줄

## Problem

이 저장소에는 이징·지속시간 토큰이 없다. 값이 컴포넌트마다 하드코딩돼 있고, 같은 목적에 서로 다른 커브가 중복 존재한다(`cubic-bezier(0.2,0,0,1)` vs `[0.4,0,0.2,1]`). 그리고 전역 CSS 세 블록에 문제가 몰려 있다.

```css
/* src/app/globals.css:251-253 — current */
a, button {
  transition: all 0.15s ease;
}
```
사이트의 모든 `<a>`·`<button>`(수백 개)에 `transition: all`이 걸린다. 색상 하나 바뀌어도 브라우저가 애니메이션 가능한 모든 속성의 변경 여부를 매 프레임 감시한다.

```css
/* src/app/globals.css:255-265 — current */
.card-hover {
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s cubic-bezier(0.2, 0, 0, 1);
}
.card-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px -8px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.04);
}
.dark .card-hover:hover {
  box-shadow: 0 12px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px var(--border-color);
}
```
`:hover`가 `(hover: hover) and (pointer: fine)`로 게이팅되지 않았다. 터치 기기에서 카드를 탭하면 `:hover`가 발화해 카드가 들뜬 채 고착된다(다른 곳을 탭해야 풀림). 커브 자체는 올바른 강한 ease-out이므로 **커브와 지속시간은 유지한다**.

```css
/* src/app/globals.css:267-277 — current */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeInUp 0.5s ease forwards;
}
.animate-delay-1 { animation-delay: 0.1s; opacity: 0; }
.animate-delay-2 { animation-delay: 0.2s; opacity: 0; }
.animate-delay-3 { animation-delay: 0.3s; opacity: 0; }
```
세 가지 문제가 겹쳐 있다.
1. 진입 애니메이션에 `ease`(= `cubic-bezier(0.25, 0.1, 0.25, 1)`, hover/색상 전환용 커브)를 썼다. 진입은 ease-out이어야 한다.
2. 0.5s는 UI 애니메이션 예산 300ms를 초과한다. `animate-delay-3`과 겹치면 콘텐츠가 완전히 보이기까지 800ms 걸린다.
3. `translateY(16px)`는 단순 페이드가 아니라 위치 이동 = 전정기관 자극형 모션인데, `prefers-reduced-motion` 대응이 전혀 없다. 이 클래스는 13개 파일에서 쓰여 사실상 모든 페이지 진입에 적용된다.

**함정(반드시 읽을 것):** `.animate-delay-*`의 `opacity: 0`은 `@keyframes` 밖의 정적 규칙이다. reduced-motion 대응으로 흔한 `animation: none !important` 스니펫을 쓰면 `opacity: 0`을 되돌릴 장치가 사라져 **콘텐츠가 영구히 안 보이게 된다**. 애니메이션을 끄지 말고 페이드 전용으로 갈아끼울 것.

## Target

```css
/* target — 토큰. globals.css의 @theme 블록(파일 상단, --font-size-* 등이 있는 곳)에 추가 */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
```

```css
/* target — src/app/globals.css:251 자리 */
a, button {
  transition: color var(--duration-fast) ease, background-color var(--duration-fast) ease,
              border-color var(--duration-fast) ease, opacity var(--duration-fast) ease;
}
```

```css
/* target — src/app/globals.css:255 자리. 커브·지속시간은 그대로, hover만 게이팅 */
.card-hover {
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s cubic-bezier(0.2, 0, 0, 1);
}
@media (hover: hover) and (pointer: fine) {
  .card-hover:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px -8px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.04);
  }
  .dark .card-hover:hover {
    box-shadow: 0 12px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px var(--border-color);
  }
}
```

```css
/* target — src/app/globals.css:267 자리 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
/* reduced-motion용 — 위치 이동 없이 페이드만 */
@keyframes fadeInOnly {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fadeInUp var(--duration-slow) var(--ease-out) forwards;
}
.animate-delay-1 { animation-delay: 0.1s; opacity: 0; }
.animate-delay-2 { animation-delay: 0.2s; opacity: 0; }
.animate-delay-3 { animation-delay: 0.3s; opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  /* 움직임만 제거하고 페이드는 남긴다. animation을 끄면 위 opacity:0이 영구 고착되므로 절대 none으로 두지 말 것 */
  .animate-fade-in {
    animation: fadeInOnly var(--duration-base) ease forwards;
  }
  .animate-delay-1, .animate-delay-2, .animate-delay-3 {
    animation-delay: 0s;
  }
  .card-hover {
    transition: box-shadow 0.3s ease;
  }
  @media (hover: hover) and (pointer: fine) {
    .card-hover:hover { transform: none; }
  }
}
```

## Repo conventions to follow

- 이 프로젝트는 Tailwind v4를 쓰며 `src/app/globals.css` 상단의 `@theme` 블록에 토큰을 정의한다. 예시(파일 상단, 실제 존재): `--font-size-xs: 0.825rem;`, `--color-accent: var(--accent);`, `--max-width-content: 1100px;`. 새 이징·지속시간 토큰도 **같은 `@theme` 블록에** 추가한다.
- 색상 토큰은 `:root`와 `.dark`에서 값을 갈아끼우는 패턴이다(`--accent: #2a9d6e` / `.dark { --accent: #5eba97 }`). 이징·지속시간은 테마에 따라 달라지지 않으므로 `@theme`에만 두고 `:root`/`.dark`에는 넣지 않는다.
- 주석은 한국어로 단다. 기존 섹션 주석 형식을 따를 것: `/* ─── Transitions ─── */`

## Steps

1. `src/app/globals.css` 상단 `@theme` 블록(`--font-size-4xl` 줄 근처, 기존 토큰들이 끝나는 지점)에 위 Target의 토큰 5개를 추가한다. `/* ─── Motion ─── */` 주석을 앞에 단다.
2. `src/app/globals.css:251-253`의 `a, button { transition: all 0.15s ease; }`를 Target의 속성 명시 버전으로 교체한다.
3. `src/app/globals.css:255-265`의 `.card-hover` 블록을 Target 버전으로 교체한다. **`.card-hover` 자체의 `transition` 줄은 한 글자도 바꾸지 말 것** — `:hover`와 `.dark .card-hover:hover`만 `@media (hover: hover) and (pointer: fine)` 안으로 옮긴다.
4. `src/app/globals.css:267-277`의 fade 블록을 Target 버전으로 교체한다. `@keyframes fadeInOnly` 추가, `.animate-fade-in`의 `0.5s ease` → `var(--duration-slow) var(--ease-out)`.
5. 파일 맨 끝에 Target의 `@media (prefers-reduced-motion: reduce)` 블록을 추가한다.

## Boundaries

- `src/app/globals.css` **외의 파일은 절대 건드리지 말 것.** 다른 계획(002~005)이 다른 파일을 담당한다.
- `.card-hover`의 커브(`cubic-bezier(0.2, 0, 0, 1)`)와 지속시간(0.3s)은 유지한다. 이미 올바른 값이다.
- `@keyframes fadeInUp`의 `translateY(16px)` 값은 유지한다(reduced-motion이 아닐 때는 그대로 쓴다).
- 새 의존성 추가 금지.
- 스텝의 코드가 실제 파일과 다르면(커밋 스탬프 이후 드리프트) 임의로 고치지 말고 멈추고 보고할 것.

## Verification

- **Mechanical**: `npm run build` → `✓ Compiled successfully`. `npx tsc --noEmit` → 신규 에러 0(기존 `.next/types/validator.ts` 에러 2건은 무관하니 무시).
- **Feel check**: `npm run dev` 후 `http://localhost:3000/ko`
  - 페이지 진입 페이드가 이전보다 확실히 빠르다(500ms → 300ms). 콘텐츠가 늦게 뜨는 느낌이 사라졌는지 본다.
  - DevTools Animations 패널에서 재생을 10%로 낮추고 진입을 관찰: 초반에 빠르게 튀어나가 끝에서 부드럽게 안착해야 한다(ease-out). 초반이 굼뜨면 커브가 잘못 들어간 것.
  - DevTools Rendering 패널 → `Emulate CSS media feature prefers-reduced-motion: reduce` 켜고 새로고침: **콘텐츠가 보여야 한다**(안 보이면 opacity 함정에 빠진 것 — 즉시 되돌릴 것). 위아래 움직임 없이 페이드만 보여야 한다.
  - 같은 상태에서 프로젝트 카드에 마우스를 올려본다: 카드가 뜨지 않고(transform 없음) 그림자만 바뀌어야 한다.
  - DevTools에서 모바일 기기 에뮬레이션(터치)으로 전환 → `/ko/projects`에서 카드를 탭: 카드가 들린 채 고착되지 않아야 한다.
- **Done when**: 위 feel check 5개가 전부 통과하고 빌드가 성공한다.
