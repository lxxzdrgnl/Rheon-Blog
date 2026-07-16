# 002 — JS 기반 모션에 reduced-motion 대응

- **Status**: TODO
- **Commit**: dbea070
- **Severity**: HIGH
- **Category**: 접근성(6)
- **Estimated scope**: 2 파일, ~15줄

## Problem

계획 001이 CSS 모션의 reduced-motion을 처리한다. 이 계획은 **JS/클래스 토글로 구동되는 모션** 두 곳을 처리한다. 둘 다 현재 `prefers-reduced-motion`를 완전히 무시한다.

```tsx
/* src/components/layout/Header.tsx:37-39 — current */
className={`sticky top-0 z-50 bg-bg-primary/90 backdrop-blur-xl transition-transform duration-300 relative ${
  hidden && !mobileMenuOpen ? "-translate-y-full" : "translate-y-0"
}`}
```
스크롤 방향이 바뀔 때마다 헤더 전체가 자기 높이만큼 화면 밖으로 나갔다 들어온다. 큰 요소가 반복적으로 이동하는 전형적인 전정기관 자극형 모션인데, 세션당 수십 번 발생한다.

```tsx
/* src/components/blog/ResumeLayout.tsx:274-279 — current */
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
```tsx
/* src/components/blog/ResumeLayout.tsx:299-302 — current */
<motion.div
  layout
  transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
  className="space-y-1.5"
>
```
`ResumeLayout.tsx`는 `motion/react`를 쓰는 유일한 컴포넌트다(이미 `import { motion, AnimatePresence } from "motion/react"`가 4행에 있다). `useReducedMotion()` 훅을 붙이는 비용이 가장 낮은 지점인데 미사용이다. 특히 `layout` 애니메이션은 필터 칩을 누를 때마다 프로젝트 목록 전체가 재배치되며 움직인다.

## Target

```tsx
/* target — src/components/layout/Header.tsx */
// 파일 상단 import에 추가
import { useReducedMotion } from "motion/react";

// 컴포넌트 본문, 기존 훅들 근처
const reduceMotion = useReducedMotion();

// className 부분
className={`sticky top-0 z-50 bg-bg-primary/90 backdrop-blur-xl relative ${
  reduceMotion ? "" : "transition-transform duration-300"
} ${
  hidden && !mobileMenuOpen && !reduceMotion ? "-translate-y-full" : "translate-y-0"
}`}
```
reduced-motion에서는 헤더가 아예 숨지 않고 항상 보인다(움직임 제거). 이게 올바른 처리다 — 이동을 즉시 점프로 바꾸면 더 나쁘다.

```tsx
/* target — src/components/blog/ResumeLayout.tsx */
// 4행 import 수정
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

// 120행 근처, const { t, locale } = useI18n(); 아래
const reduceMotion = useReducedMotion();

// 274행 motion.div
<motion.div
  key="clear-filters"
  initial={{ height: 0 }}
  animate={{ height: "auto" }}
  exit={{ height: 0 }}
  transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
  style={{ overflow: "hidden" }}
  className="!mt-0"
>

// 299행 motion.div
<motion.div
  layout={!reduceMotion}
  transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
  className="space-y-1.5"
>
```

## Repo conventions to follow

- `motion` v12를 `motion/react`에서 임포트한다(`framer-motion` 아님). 기존 예시: `src/components/blog/ResumeLayout.tsx:4` — `import { motion, AnimatePresence } from "motion/react";`
- 훅은 컴포넌트 본문 최상단에 모아 선언한다. 기존 예시: `src/components/blog/ResumeLayout.tsx:120-121` — `const { t, locale } = useI18n(); const localized = useLocalized();`
- `Header.tsx`는 이미 `"use client"` 컴포넌트다(훅 사용 가능). `ResumeLayout.tsx`도 마찬가지.
- 주석은 한국어로 단다.

## Steps

1. `src/components/layout/Header.tsx`: `motion/react`에서 `useReducedMotion`을 임포트한다. 이 파일에 기존 `motion/react` 임포트가 없으면 새 import 줄을 추가한다.
2. 같은 파일 컴포넌트 본문의 기존 훅 선언들 아래에 `const reduceMotion = useReducedMotion();`을 추가한다.
3. 같은 파일 37-39행의 `className` 템플릿 리터럴을 Target 버전으로 교체한다. `// reduced-motion: 헤더를 숨기지 않고 항상 보이게 — 큰 요소의 반복 이동은 전정기관을 자극한다` 주석을 위에 단다.
4. `src/components/blog/ResumeLayout.tsx:4`의 import에 `useReducedMotion`을 추가한다.
5. 같은 파일 120행 근처 `const { t, locale } = useI18n();` 아래에 `const reduceMotion = useReducedMotion();`을 추가한다.
6. 같은 파일 277행의 `transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}`를 Target의 삼항 버전으로 교체한다.
7. 같은 파일 300행의 `layout`을 `layout={!reduceMotion}`으로 바꾼다.

## Boundaries

- **`src/components/layout/Header.tsx`와 `src/components/blog/ResumeLayout.tsx` 두 파일만 수정한다.** `src/app/globals.css`는 계획 001 담당이니 절대 건드리지 말 것.
- `ResumeLayout.tsx:274`의 `height: 0 → auto` 자체는 **이 계획에서 고치지 않는다**(계획 005 담당). reduced-motion 분기만 추가한다.
- 마크업·구조 변경 금지. 모션 관련 속성만 손댄다.
- 새 의존성 추가 금지.
- 스텝의 코드가 실제 파일과 다르면 임의로 고치지 말고 멈추고 보고할 것.

## Verification

- **Mechanical**: `npx tsc --noEmit` → 신규 에러 0(기존 `.next/types/validator.ts` 에러 2건은 무시). `npm run build` → 성공.
- **Feel check**: `npm run dev` 후 `http://localhost:3000/ko`
  - DevTools Rendering 패널 → `Emulate CSS media feature prefers-reduced-motion: reduce` 켠 상태에서 아래로 스크롤: **헤더가 사라지지 않고 계속 보여야 한다.**
  - 같은 상태에서 홈의 기술 스택 필터 칩을 클릭: 프로젝트 목록이 재배치되며 미끄러지지 않고 즉시 바뀌어야 한다. "필터 초기화" 버튼도 높이 애니메이션 없이 바로 나타나야 한다.
  - reduced-motion을 **끄고** 같은 동작 반복: 헤더 숨김·목록 재배치 애니메이션이 이전과 똑같이 동작해야 한다(기능 회귀 없음).
- **Done when**: reduced-motion ON에서 헤더가 안 숨고 목록 재배치 모션이 없으며, OFF에서는 기존 동작이 그대로다.
