# 모션 개선 계획

`improve-animations` 감사(2026-07-16, 커밋 `dbea070` 기준)에서 나온 계획들. 세 에이전트가 카테고리별로 감사하고, 인용 위치를 전부 재검증한 뒤 확정한 항목만 남겼다.

## 계획 목록

| # | 제목 | 심각도 | 대상 파일 | Status |
|---|---|---|---|---|
| 001 | 모션 토큰 도입 + 전역 CSS 기본값 교정 | HIGH | `globals.css` | TODO |
| 002 | JS 기반 모션에 reduced-motion 대응 | HIGH | `Header.tsx`, `ResumeLayout.tsx` | TODO |
| 003 | 카테고리 드롭다운 기점·물성 + 터치 대응 | MEDIUM | `FilterBar.tsx` | TODO |
| 004 | 모달·모바일 메뉴 진입 트랜지션 | MEDIUM | `globals.css`, `ConfirmModal.tsx`, `MobileMenu.tsx` | TODO |
| 005 | 아코디언 height → grid-template-rows | MEDIUM | `ResumeLayout.tsx` | TODO |

## 실행 순서와 의존성

**001 → 004**: 둘 다 `globals.css`를 수정한다. 004는 001이 만든 `@media (prefers-reduced-motion: reduce)` 블록 안에 규칙을 추가하므로 **001을 먼저** 실행해야 한다. 병렬 실행 금지(같은 파일 충돌).

**002 → 005**: 둘 다 `ResumeLayout.tsx`를 수정한다. 005는 002가 추가한 `const reduceMotion = useReducedMotion();`을 재사용하므로 **002를 먼저** 실행한다. 병렬 실행 금지.

**003**은 `FilterBar.tsx`만 건드려 어느 것과도 충돌하지 않는다. 아무 때나 실행 가능.

권장 순서:
1. **001** (단독 — 나머지의 토대)
2. **002**와 **003** 병렬 (파일 disjoint)
3. **004**와 **005** 병렬 (파일 disjoint)

## 감사에서 제외된 항목

- **`PostsExplorer.tsx:205` / `ProjectsExplorer.tsx:117`의 key 리마운트 페이드 재생** — 사용자가 유지 결정.
- **`PostThumbnail.tsx`의 `duration-500` 호버 3종** — 의도한 디자인. 유지.

## 감사 결과 이미 올바른 것 (건드리지 말 것)

- `ease-in`을 UI에 쓴 곳 없음.
- `scale(0)` 진입 없음.
- 키보드 조작에 걸린 애니메이션 없음.
- `.card-hover`의 `cubic-bezier(0.2, 0, 0, 1)` — 올바른 강한 ease-out. 커브·지속시간 유지.
- `InProgressBadge.tsx:11`의 `motion-reduce:animate-none` — reduced-motion 처리의 올바른 예시.

## 알려진 함정

`.animate-delay-1/2/3`의 `opacity: 0`은 `@keyframes` 밖의 정적 규칙이다. reduced-motion 대응으로 흔한 `animation: none !important` 스니펫을 쓰면 opacity를 되돌릴 장치가 사라져 **콘텐츠가 영구히 안 보이게 된다**. 애니메이션을 끄지 말고 페이드 전용 키프레임으로 갈아끼울 것(계획 001이 그렇게 한다).
