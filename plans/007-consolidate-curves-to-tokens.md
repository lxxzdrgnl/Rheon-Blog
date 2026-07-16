# 007 — 하드코딩된 커브를 모션 토큰으로 통합

- **Status**: TODO
- **Commit**: 700586a (계획 001·002·005 적용 후 기준)
- **Severity**: LOW
- **Category**: 응집도·토큰(7)
- **Estimated scope**: 2 파일, ~10줄

## Problem

계획 001이 `src/app/globals.css`의 `@theme`에 모션 토큰을 만들었다:

```css
/* src/app/globals.css:36-41 — 현재 존재 */
/* ─── Motion ─── */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
```

하지만 001의 범위가 `globals.css` 한 파일이었던 탓에 **정작 토큰을 써야 할 곳들이 아직 하드코딩 상태다.** 토큰 통합(감사 발견사항 10번)이 절반만 된 셈이다.

같은 "화면 내 이동"이라는 목적에 커브 두 개가 미묘하게 다른 값으로 공존한다:

```css
/* src/app/globals.css:265 — current */
.card-hover {
  transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.3s cubic-bezier(0.2, 0, 0, 1);
}
```
```tsx
/* src/components/blog/ResumeLayout.tsx:298, :337 — current */
transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
...
layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
```

그리고 이징이 아예 없는 곳:
```tsx
/* src/components/blog/ResumeLayout.tsx:306 — current */
transition={{ opacity: { duration: 0.3 } }}
```

```tsx
/* src/components/blog/ResumeLayout.tsx:338 — current */
opacity: { duration: 0.18, ease: "easeOut", delay: 0.1 },
```
`0.18`은 어떤 토큰에도 대응하지 않는 매직 넘버다.

## Target

**중요한 제약**: Framer Motion(`motion/react`)의 `ease` 속성은 CSS 변수를 읽지 못한다. JS 값이라 `var(--ease-out)`을 넣을 수 없다. 따라서 TS 쪽은 **TS 상수**로 통합하고, CSS 쪽은 CSS 변수로 통합한다. 두 곳의 값이 같은 숫자를 가리키게 하는 것이 목표다.

### 1) TS 모션 상수 신설

`src/lib/styles.ts`에 추가한다(이 파일이 이미 이 저장소의 "반복되는 스타일 값 단일 소스"다):

```ts
/**
 * 모션 값 — globals.css의 @theme 모션 토큰과 같은 숫자를 가리킨다.
 * Framer Motion의 ease는 CSS 변수를 못 읽어서 JS 상수로 따로 둔다.
 * 값을 바꿀 때 globals.css의 --ease-* / --duration-* 도 같이 바꿀 것.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const DURATION_FAST = 0.15;
export const DURATION_BASE = 0.2;
export const DURATION_SLOW = 0.3;
```

### 2) `ResumeLayout.tsx` — 상수 사용

```tsx
/* target — import 추가 */
import { EYEBROW, EASE_OUT, DURATION_BASE, DURATION_SLOW } from "@/lib/styles";
```

```tsx
/* target — :298 */
transition={{ layout: { duration: DURATION_SLOW, ease: EASE_OUT } }}
```

```tsx
/* target — :306. 이징이 없던 곳에 명시적으로 부여 */
transition={{ opacity: { duration: DURATION_SLOW, ease: EASE_OUT } }}
```

```tsx
/* target — :337-338. 매직 넘버 0.18 → DURATION_BASE(0.2), "easeOut" → EASE_OUT */
layout: { duration: DURATION_SLOW, ease: EASE_OUT },
opacity: { duration: DURATION_BASE, ease: EASE_OUT, delay: 0.1 },
```

`delay: 0.1`은 그대로 둔다 — 항목 등장 지연이라 이징·지속시간 토큰과 성격이 다르다.

### 3) `globals.css` — card-hover를 토큰으로

```css
/* target — src/app/globals.css:265 */
.card-hover {
  transition: transform var(--duration-slow) var(--ease-out), box-shadow var(--duration-slow) var(--ease-out);
}
```

**주의: 이건 실제 커브 변경이다.** `cubic-bezier(0.2, 0, 0, 1)` → `cubic-bezier(0.23, 1, 0.32, 1)`. 둘 다 강한 ease-out이지만 후자가 더 튀어나가듯 감속한다. 계획 001의 감사에서 `.card-hover`의 기존 커브는 "이미 올바른 값"으로 판정됐으므로, **이 변경이 카드 호버 느낌을 눈에 띄게 바꾸면 되돌린다**(Verification의 feel check 참조).

## Repo conventions to follow

- `src/lib/styles.ts`가 반복되는 스타일 값의 단일 소스다. 파일 상단 주석에 타입 스케일 규약이 있고, `EYEBROW`/`CARD_TITLE`/`CARD_SNIPPET` 상수를 export한다. 모션 상수도 같은 파일에 둔다. 기존 예시:
  ```ts
  export const EYEBROW = "text-[13px] font-bold uppercase tracking-wide";
  ```
- `ResumeLayout.tsx:6`이 이미 `import { EYEBROW } from "@/lib/styles";`로 이 파일에서 임포트한다 — 같은 import 줄에 추가한다.
- 주석은 한국어로 단다.

## Steps

1. `src/lib/styles.ts` 파일 끝에 Target 1)의 모션 상수 4개를 주석과 함께 추가한다.
2. `src/components/blog/ResumeLayout.tsx:6`의 `import { EYEBROW } from "@/lib/styles";`를 `import { EYEBROW, EASE_OUT, DURATION_BASE, DURATION_SLOW } from "@/lib/styles";`로 바꾼다.
3. 같은 파일 298행의 `transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}`를 Target 버전으로 교체한다.
4. 같은 파일 306행의 `transition={{ opacity: { duration: 0.3 } }}`를 Target 버전으로 교체한다.
5. 같은 파일 337-338행을 Target 버전으로 교체한다. `delay: 0.1`은 유지한다.
6. `src/app/globals.css:265`의 `.card-hover` transition을 Target 3)의 토큰 버전으로 교체한다.
7. `EASE_OUT`이 `as const` 튜플이라 Framer Motion의 `ease` 타입과 안 맞으면, `as const`를 빼고 `export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];`로 선언한다. **타입 에러를 `as any`로 뭉개지 말 것.**

## Boundaries

- **`src/lib/styles.ts`와 `src/components/blog/ResumeLayout.tsx`, `src/app/globals.css` 세 파일만 수정한다.**
- **`globals.css`에서 `.card-hover`의 transition 줄 하나만 바꾼다.** `@media (hover: hover)` 블록, `.animate-fade-in`, `@media (prefers-reduced-motion)` 블록, Entry transitions 블록은 건드리지 말 것.
- `ResumeLayout.tsx`의 `reduceMotion` 분기 로직을 바꾸지 말 것 — 값만 상수로 교체한다.
- 005가 만든 grid 아코디언(`grid-rows-[0fr]`/`grid-rows-[1fr]`, `duration-300 ease-out`)은 Tailwind 유틸이라 이 계획 범위 밖이다. 건드리지 말 것.
- `delay: 0.1`을 토큰화하지 말 것.
- 새 의존성 추가 금지.
- 스텝의 코드가 실제 파일과 다르면 임의로 고치지 말고 멈추고 보고할 것.

## Verification

- **Mechanical**: `npx tsc --noEmit` → 신규 에러 0. `npm run build` → 성공.
- **Feel check**: `npm run dev` 후 `http://localhost:3000/ko`
  - **카드 호버 회귀 확인(가장 중요)**: `/ko/projects`에서 카드에 마우스를 올린다. 커브가 `(0.2,0,0,1)` → `(0.23,1,0.32,1)`로 바뀌었으므로 미묘하게 달라진다. **들뜨는 느낌이 이전보다 확 튀거나 어색해지면 이 변경을 되돌리고(`.card-hover`만 원래 `cubic-bezier(0.2, 0, 0, 1)`로) 보고할 것.** 구분이 안 갈 정도면 통합 성공이다.
  - 홈에서 기술 스택 필터 칩을 클릭: 프로젝트 목록 재배치가 이전과 같은 속도·느낌이어야 한다(0.3s 유지).
  - 같은 동작에서 항목 페이드인: `0.18s → 0.2s`로 아주 조금 느려졌다. 체감 차이가 없어야 정상.
  - DevTools Animations 패널에서 재생 10%로 낮추고 목록 재배치를 관찰: 초반이 빠르고 끝이 부드러워야 한다.
  - DevTools Rendering → `prefers-reduced-motion: reduce`: 002·005가 넣은 분기가 그대로 동작해야 한다(목록 재배치·아코디언 모션 없음).
- **Done when**: 빌드·타입체크 통과, 카드 호버가 어색해지지 않고, 하드코딩된 `[0.4, 0, 0.2, 1]`·`0.18`·`"easeOut"`이 `ResumeLayout.tsx`에서 사라진다(`grep -n "0.4, 0, 0.2, 1\|0.18\|easeOut" src/components/blog/ResumeLayout.tsx` → 결과 없음).
