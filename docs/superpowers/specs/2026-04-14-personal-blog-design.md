# Personal Blog Design Spec

## Overview

Next.js App Router 기반 개인 블로그. 한국어/영어 지원, SSR로 SEO 최적화, Notion Academy 스타일의 깔끔한 디자인. 마크다운 에디터로 글 작성, OpenAI API 자동 번역, 미니PC Docker 배포.

---

## Tech Stack

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router + Server Actions) |
| 언어 | TypeScript |
| DB | SQLite (better-sqlite3) |
| ORM | Drizzle |
| 이미지 저장 | MinIO (기존 미니PC 인스턴스, 블로그용 버킷 추가) |
| 마크다운 에디터 | @uiw/react-md-editor |
| 마크다운 렌더링 | react-markdown + rehype/remark 플러그인 |
| 코드 하이라이팅 | rehype-pretty-code + Shiki (GitHub 코드 스타일) |
| i18n | next-intl + localStorage |
| 인증 | JWT (access + refresh token, httpOnly 쿠키) |
| 번역 | OpenAI API (gpt-4o-mini) |
| 검색 | SQLite FTS5 |
| 스타일링 | Tailwind CSS |
| 다크모드 | next-themes |
| 개발환경 | Docker Compose (Next.js + SQLite + MinIO) |
| 배포 | GitHub Actions → 미니PC Docker |

---

## Data Model

### posts

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | INTEGER, PK, auto | |
| title | TEXT | 한국어 제목 |
| title_en | TEXT, nullable | 영문 번역 제목 |
| slug | TEXT, unique | URL용 영문 슬러그 (자동생성, 수정 가능) |
| content | TEXT | 마크다운 본문 (한국어) |
| content_en | TEXT, nullable | 영문 번역 본문 |
| thumbnail | TEXT, nullable | 대표이미지 URL (MinIO). null이면 제목 기반 썸네일 |
| category_id | INTEGER, FK → categories | |
| is_published | BOOLEAN, default false | |
| view_count | INTEGER, default 0 | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### categories

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | INTEGER, PK | |
| name | TEXT | 한국어 |
| name_en | TEXT | 영어 |
| slug | TEXT, unique | |

### tags

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | INTEGER, PK | |
| name | TEXT | 한국어 |
| name_en | TEXT | 영어 |

### post_tags

| 컬럼 | 타입 | 설명 |
|---|---|---|
| post_id | FK → posts | |
| tag_id | FK → tags | |

### comments

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | INTEGER, PK | |
| post_id | FK → posts | |
| parent_id | INTEGER, nullable, FK → comments | 대댓글. 대댓글에 답글 달아도 parent_id는 원 댓글을 가리킴 (1단 UI) |
| nickname | TEXT | |
| password | TEXT, hashed | |
| content | TEXT | |
| created_at | DATETIME | |
| is_deleted | BOOLEAN, default false | 소프트 삭제 |

### settings (key-value)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| key | TEXT, PK | hero_title, hero_subtitle, blog_title, show_view_count 등 |
| value | TEXT | JSON 값 |

---

## Page Structure

```
/ (메인)
├── 히어로 섹션 — 블로그 소개 (settings에서 관리) + 대표 글
├── 카드 그리드 — 최신 글 목록 (썸네일 or 제목 카드)
├── 카테고리 필터 + 태그 필터
└── 검색바

/post/[slug] (글 상세)
├── 제목, 작성일, 카테고리, 태그
├── 마크다운 렌더링 (velog 스타일)
├── 목차 (우측 사이드바, 헤딩 기반 자동 생성)
├── 코드 블럭 (GitHub 스타일, Shiki 하이라이팅)
├── 댓글 섹션 (닉네임 + 비밀번호)
└── 조회수 (settings에서 표시/숨김 제어)

/category/[slug] — 카테고리별 글 목록
/tag/[slug] — 태그별 글 목록
/search?q=... — 검색 결과

/my (어드민, JWT 인증 필요)
├── /my — 대시보드 (글 목록, 조회수 통계)
├── /my/write — 글 작성/수정 (수정 시 ?id=xx)
├── /my/settings — 설정 (조회수 표시, 히어로 문구, 블로그 제목, 고아 이미지 정리 버튼)
└── /my/login — 로그인 페이지
```

---

## Core Flows

### 글 작성/발행

1. `/my/write`에서 마크다운 에디터로 작성
2. 이미지 드래그&드롭 → MinIO 업로드 → 에디터에 `![](url)` 삽입
3. 업로드된 이미지 중 대표이미지 선택 (미선택 시 thumbnail = null → 제목 기반 썸네일)
4. 카테고리 선택, 태그 입력 (기존 태그 자동완성 + 새 태그 생성)
5. slug 자동 생성 (제목 기반 영문), 직접 수정 가능
6. "임시저장" → is_published = false
7. "발행" → is_published = true + OpenAI API로 title_en, content_en 자동 번역
8. 번역 완료 후 `/my/write?id=xx`에서 영문 번역본 확인/수정 가능

### 이미지 정리

- 글 발행/수정 시 해당 글의 본문에서 참조하는 이미지 URL 파싱
- 해당 글의 이전 이미지 중 더 이상 참조되지 않는 이미지를 MinIO에서 삭제
- 전체 스캔이 아닌 해당 글 범위만 처리

### 댓글

1. 닉네임 + 비밀번호 입력 후 댓글 작성
2. "답글" 버튼 → parent_id 설정, 같은 입력 폼
3. 대댓글에 답글 달아도 parent_id는 원 댓글을 가리킴 → UI 1단 들여쓰기
4. 삭제는 비밀번호 확인 후 소프트 삭제 ("삭제된 댓글입니다" 표시)

### 검색

- SQLite FTS5로 제목 + 본문 풀텍스트 검색
- 영문 모드에서는 title_en, content_en에서 검색
- 검색 결과는 메인과 동일한 카드 그리드

### 어드민 인증

- `/my/login`에서 ID/PW 입력 → 환경변수와 비교 → JWT 발급 (httpOnly 쿠키)
- access token + refresh token. access 만료 시 자동 리프레시
- refresh token까지 만료 시 로그인 페이지로 리다이렉트
- Next.js 미들웨어에서 `/my/*` (login 제외) 접근 시 JWT 검증

### i18n

- URL 동일 유지 (`/post/slug`)
- 헤더에 한/EN 토글, 선택값 localStorage 저장
- 토글 시 title_en, content_en으로 전환
- 번역이 없는 글은 한국어 원문 그대로 표시
- UI 텍스트 (버튼, 라벨 등)는 next-intl로 전환

---

## Design Guidelines (Notion Academy Style)

### 기본 원칙

- 화이트 베이스, 섹션 구분은 색이 아닌 넉넉한 여백으로
- 모노톤 (흑백) 기반, 포인트 컬러 최소한 (파란색 CTA 버튼 정도)
- 깔끔하고 정돈된 느낌, 과한 장식 없음

### 색상

| 용도 | 라이트 | 다크 |
|---|---|---|
| 배경 | #ffffff | #191919 |
| 카드 배경 (variant) | #f7f6f3 | #2f2f2f |
| 텍스트 (primary) | #37352f | #e0e0e0 |
| 텍스트 (secondary) | #6b6b6b | #9b9b9b |
| 보더 | #e0e0e0 | #3a3a3a |
| 포인트 (CTA) | #2383e2 | #529cca |

### 타이포그래피

- 제목: 굵은 산세리프, 큰 사이즈 (32~40px 히어로, 24px 섹션)
- 본문: 가벼운 산세리프, 적당한 line-height (1.6~1.8)
- 코드: GitHub 스타일, Shiki 하이라이팅

### 카드

- 얇은 보더 (`1px solid`, 그림자 없음) 또는 밝은 그레이 배경 (보더 없음)
- 둥근 모서리: 카드 `8~12px`, 버튼 `20px` (pill 형태)
- 호버 시 미세한 그림자 또는 보더 강조

### 레이아웃

- 최대 너비 제한 (콘텐츠 영역 ~1080px)
- 카드 그리드: 데스크톱 3~4열, 태블릿 2열, 모바일 1열
- 섹션 간 넉넉한 수직 여백 (80~120px)

### 히어로 섹션

- 좌측 텍스트 (제목 + 서브타이틀) + 우측 여백 또는 이미지
- CTA 버튼: filled (파란색) + outlined 조합
- 심플하고 임팩트 있게

### 네비게이션

- 상단 고정, 좌측 블로그 로고+메뉴, 우측 검색+언어토글+다크모드토글
- 심플한 구성

### 글 상세 (velog 스타일)

- 중앙 정렬 본문 (최대 ~768px)
- 우측 사이드바에 목차 (스크롤 따라 하이라이트)
- 코드 블럭: GitHub 스타일, 라이트/다크 테마 대응

### 반응형

- 모바일/태블릿/데스크톱 지원 (Tailwind 반응형 유틸리티)
- 모바일: 목차 접기, 카드 1열, 네비게이션 햄버거 메뉴

---

## Deployment

### 개발환경

- Docker Compose: Next.js 컨테이너 + MinIO (개발용 로컬 인스턴스)
- SQLite는 볼륨 마운트로 영속성 확보

### 프로덕션

- GitHub Actions: push → Docker 이미지 빌드 → 미니PC로 배포
- 미니PC: Docker로 Next.js 실행
- MinIO: 기존 미니PC MinIO 인스턴스에 블로그용 버킷 추가 (새로 설치 X)
- SQLite 파일은 호스트 볼륨 마운트

### 환경변수

```
ADMIN_ID=xxx
ADMIN_PASSWORD=xxx
JWT_SECRET=xxx
JWT_REFRESH_SECRET=xxx
MINIO_ENDPOINT=xxx
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
MINIO_BUCKET=blog
OPENAI_API_KEY=xxx
DATABASE_PATH=./data/blog.db
```
