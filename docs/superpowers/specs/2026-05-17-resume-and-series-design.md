# Resume-Style Main Page & Post Series Design Spec

## Overview

두 가지 기능 추가:
1. **메인 페이지를 원페이지 이력서 스타일로 재구성** — 자기소개, 경력, 기술스택, 프로젝트, 최근 포스트, 소셜 링크 섹션으로 구성. 모든 섹션은 Admin에서 CRUD 가능.
2. **포스트 시리즈 기능** — Velog 스타일. 포스트를 시리즈로 묶고, 포스트 상세 페이지에서 시리즈 목차 + 이전/다음 네비게이션 표시.

---

## 1. Resume-Style Main Page

### 1.1 섹션 구성 (위→아래 순서)

| # | 섹션 | 데이터 소스 | 비고 |
|---|------|------------|------|
| 1 | Hero/Intro | `settings` (기존) | 이름, 직함, 한 줄 소개, 프로필 사진 |
| 2 | About Me | `settings` (기존) | 마크다운 자기소개 문단 |
| 3 | Experience | `experiences` (신규) | 회사, 직책, 기간, 설명 |
| 4 | Skills | `skills` (신규) | 기술명 + 카테고리별 그룹 |
| 5 | Projects | `portfolios` (기존) | 기존 포트폴리오 섹션 활용 |
| 6 | Recent Posts | `posts` (기존) | 최근 게시글 미리보기 |
| 7 | Contact/Links | `social_links` (신규) | GitHub, LinkedIn, 이메일 등 |

### 1.2 신규 테이블

#### `experiences`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER, PK, auto | |
| company | TEXT, NOT NULL | 회사명 (한국어) |
| companyEn | TEXT | 회사명 (영어) |
| role | TEXT, NOT NULL | 직책 (한국어) |
| roleEn | TEXT | 직책 (영어) |
| description | TEXT | 업무 설명 (한국어, 마크다운) |
| descriptionEn | TEXT | 업무 설명 (영어, 마크다운) |
| startDate | TEXT, NOT NULL | 시작일 (YYYY-MM) |
| endDate | TEXT | 종료일 (YYYY-MM), null = 현재 재직중 |
| sortOrder | INTEGER, default 0 | 정렬 순서 |

#### `skills`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER, PK, auto | |
| name | TEXT, NOT NULL | 기술명 (예: React, TypeScript) |
| category | TEXT, NOT NULL | 카테고리 (한국어, 예: 프론트엔드) |
| categoryEn | TEXT | 카테고리 (영어, 예: Frontend) |
| sortOrder | INTEGER, default 0 | 카테고리 내 정렬 순서 |

#### `social_links`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER, PK, auto | |
| platform | TEXT, NOT NULL | 플랫폼명 (예: GitHub, LinkedIn, Email) |
| url | TEXT, NOT NULL | URL 또는 이메일 주소 |
| sortOrder | INTEGER, default 0 | 정렬 순서 |

### 1.3 settings 활용 (기존 테이블)

Hero/Intro와 About Me는 기존 `settings` key-value 테이블 활용:

| key | value 예시 |
|-----|-----------|
| `resume_name` | 이름 |
| `resume_name_en` | Name (English) |
| `resume_title` | 직함 |
| `resume_title_en` | Title (English) |
| `resume_tagline` | 한 줄 소개 |
| `resume_tagline_en` | One-line intro (English) |
| `resume_profile_image` | 프로필 사진 URL |
| `resume_about` | 자기소개 (마크다운) |
| `resume_about_en` | About (English, 마크다운) |

### 1.4 메인 페이지 컴포넌트 구조

```
app/page.tsx (서버 컴포넌트)
├── ResumeHeroSection    — 이름, 직함, 소개, 프로필 사진
├── AboutSection         — 마크다운 자기소개
├── ExperienceSection    — 경력 타임라인
├── SkillsSection        — 카테고리별 기술 뱃지/태그
├── PortfolioSection     — 기존 컴포넌트 재활용
├── RecentPostsSection   — 최근 포스트 카드
└── ContactSection       — 소셜 링크 아이콘
```

### 1.5 Admin 페이지

**경로: `/my/resume`**

탭 또는 섹션별로 관리:
- **Intro & About** — settings 값 편집 (이름, 직함, 소개, 프로필 사진 업로드, About 마크다운)
- **Experience** — CRUD 리스트. 회사, 직책, 기간, 설명 입력. 드래그 또는 sortOrder로 순서 변경
- **Skills** — CRUD 리스트. 기술명, 카테고리 입력. 카테고리별 그룹 표시
- **Social Links** — CRUD 리스트. 플랫폼 선택/입력, URL 입력

기존 포트폴리오 관리는 `/my/projects`에서 그대로 유지.

---

## 2. Post Series

### 2.1 신규 테이블

#### `series`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER, PK, auto | |
| title | TEXT, NOT NULL | 시리즈명 (한국어) |
| titleEn | TEXT | 시리즈명 (영어) |
| slug | TEXT, UNIQUE, NOT NULL | URL용 슬러그 |
| description | TEXT | 설명 (한국어) |
| descriptionEn | TEXT | 설명 (영어) |
| createdAt | TEXT, default now | |

### 2.2 posts 테이블 변경

기존 `posts` 테이블에 컬럼 추가:

| 컬럼 | 타입 | 설명 |
|------|------|------|
| seriesId | INTEGER, FK → series.id, nullable | 소속 시리즈 |
| seriesOrder | INTEGER, nullable | 시리즈 내 순서 (null이면 publishedAt 기준) |

### 2.3 동작

**포스트 상세 페이지 (`/post/[slug]`):**
- 포스트에 seriesId가 있으면 상단에 시리즈 목차 컴포넌트 표시
- 목차: 시리즈 제목 + 해당 시리즈의 모든 포스트 목록 (현재 글 하이라이트)
- 하단에 이전/다음 포스트 네비게이션 버튼

**정렬 로직:**
- `seriesOrder`가 있으면 해당 값 기준
- `seriesOrder`가 null이면 `publishedAt` 기준
- 혼합 시: seriesOrder가 있는 포스트가 먼저, 나머지는 publishedAt 순

**시리즈 페이지 (`/series/[slug]`):**
- 시리즈 제목, 설명
- 해당 시리즈의 포스트 목록 (순서대로, 공개된 것만)

### 2.4 Admin

**시리즈 관리 (`/my/series`):**
- 시리즈 CRUD (제목, 슬러그, 설명)
- 시리즈 선택 시 소속 포스트 목록 표시, 순서 변경 가능

**글쓰기 (`/my/write`) 수정:**
- 시리즈 선택 드롭다운 추가 (기존 시리즈 선택 또는 새 시리즈 생성)
- 시리즈 선택 시 순서 입력 필드 표시 (비워두면 자동 = publishedAt 순)

---

## 3. i18n

모든 신규 데이터는 기존 패턴을 따라 한국어/영어 이중 필드:
- `company` / `companyEn`
- `role` / `roleEn`
- `category` / `categoryEn`
- `title` / `titleEn`
- `description` / `descriptionEn`

`useLocalized()` 훅으로 현재 로케일에 맞는 값 선택.

---

## 4. 라우팅 변경 요약

| 경로 | 유형 | 설명 |
|------|------|------|
| `/` | 수정 | 이력서 스타일 메인 페이지 |
| `/series/[slug]` | 신규 | 시리즈 상세 (포스트 목록) |
| `/my/resume` | 신규 | Admin: 이력서 데이터 관리 |
| `/my/series` | 신규 | Admin: 시리즈 관리 |
| `/my/write` | 수정 | 시리즈 선택 드롭다운 추가 |
| `/post/[slug]` | 수정 | 시리즈 목차 + 이전/다음 네비게이션 추가 |
