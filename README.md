# Personal Blog

Next.js 기반 이중언어(한/영) 블로그 플랫폼. 포트폴리오 쇼케이스, 마크다운 에디터, AI 번역 기능 포함.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS, Pretendard + Newsreader |
| Database | SQLite (better-sqlite3), Drizzle ORM |
| Storage | MinIO (S3-compatible) |
| Editor | CodeMirror 6, react-markdown |
| Auth | JWT (access/refresh), bcryptjs |
| AI | OpenAI GPT-4o-mini (번역) |

## Features

### Blog
- 마크다운 에디터 (드래그 앤 드롭 이미지, 실시간 프리뷰)
- 계층형 카테고리 & 태그
- 게시 상태 관리 (공개/비공개/임시저장)
- 조회수 추적, 댓글 (비밀번호 삭제)
- 검색, 목차 자동 생성
- shields.io 뱃지 인라인 렌더링

### Portfolio
- 프로젝트 카드 목록 & 상세 페이지
- 링크 뱃지별 그룹화 (Repository, Demo/Live, 기타)
- 기술 스택 표시, 관련 포스트 연결

### i18n & Translation
- 한국어/영어 이중언어 지원
- AI 전체 번역 (제목 + 본문)
- 드래그 선택 부분 번역 (문맥 기반)

### Admin
- JWT 인증 (`/my/login`)
- 포스트/프로젝트 CRUD
- 이미지 업로드 (MinIO)
- Slug 자동 생성 (20자 제한, 편집 시 잠금)
- 다크/라이트 테마

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (MinIO용)

### Development

```bash
# 의존성 설치
npm install

# Docker로 MinIO + 앱 실행
docker-compose up

# 또는 로컬 개발
npm run dev
```

### Database

```bash
npm run db:generate   # 마이그레이션 생성
npm run db:push       # 마이그레이션 적용
npm run db:seed       # 초기 데이터
```

### Environment Variables

`.env.example`을 참고하여 `.env.local` 생성:

```
ADMIN_ID=admin
ADMIN_PASSWORD=your-password
JWT_SECRET=min-32-chars-random-string
JWT_REFRESH_SECRET=min-32-chars-random-string

MINIO_ENDPOINT=minio
MINIO_PUBLIC_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=blog
MINIO_USE_SSL=false

OPENAI_API_KEY=sk-xxx
DATABASE_PATH=./data/blog.db
```

## Deployment

Docker 멀티스테이지 빌드:

```bash
# Production
docker-compose up --build
```

- App: `http://localhost:3000`
- MinIO Console: `http://localhost:9001`

## Project Structure

```
src/
  actions/      # Server actions (posts, auth, categories, portfolios)
  app/          # Next.js App Router pages
    my/         # Admin pages (dashboard, editor, settings)
    post/       # Post detail
    posts/      # Post listing
    projects/   # Portfolio pages
  components/
    admin/      # Editor, category select, tag input, etc.
    blog/       # PostCard, PostGrid, MarkdownRenderer, etc.
    layout/     # Header, Footer, MobileMenu
    ui/         # Button, Card, SearchBar, ThemeToggle
  db/           # Drizzle schema
  i18n/         # Messages (ko/en), provider
  lib/          # Auth, markdown, minio, translate, upload
```
