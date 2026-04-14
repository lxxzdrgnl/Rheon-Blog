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

## Why Not Velog?

Velog는 훌륭한 블로그 플랫폼이지만, 개발자 포트폴리오와 이중언어 블로그를 운영하기에는 몇 가지 한계가 있습니다.

### 프로젝트 - 포스트 연결

Velog에서는 글을 시리즈로 묶을 수 있지만, **프로젝트와 포스트를 연결하는 개념이 없습니다.** 예를 들어 "사주구리" 프로젝트의 상세 페이지에서 해당 프로젝트에 대해 작성한 회고, 기술 블로그 글들을 바로 확인할 수 없습니다.

이 블로그에서는 프로젝트를 만들 때 **관련 포스트를 직접 연결**할 수 있고, 프로젝트 상세 페이지에서 연결된 글 목록이 자동으로 표시됩니다. 반대로 포스트 작성 시에도 출간 설정에서 연관 프로젝트를 선택할 수 있어, 양방향으로 컨텍스트가 연결됩니다.

### 프로젝트 링크 관리

Velog 프로필에 GitHub 링크 하나를 넣을 수 있지만, **프로젝트별로 Repository, Demo, Docs 등 여러 링크를 구분해서 관리하는 기능은 없습니다.**

이 블로그의 프로젝트 페이지에서는 링크를 뱃지 타입별로 자동 분류합니다:
- **Repository** - GitHub 등 소스코드 저장소
- **Demo / Live** - 배포된 서비스 링크
- **Links** - Docs, Figma, npm 등 기타 리소스

아이콘과 URL만 깔끔하게 표시되어 방문자가 원하는 리소스에 바로 접근할 수 있습니다.

### AI 번역 - 전체 번역과 부분 번역

이중언어 블로그를 운영하려면 모든 글을 한국어와 영어로 작성해야 합니다. Velog에서는 **같은 글을 두 번 작성하거나, 별도 영문 블로그를 운영해야 합니다.**

이 블로그에서는 에디터에 AI 번역이 내장되어 있습니다:

- **전체 번역**: 한국어로 글을 작성한 뒤 번역 버튼을 누르면 제목과 본문이 영어로 번역되어 영문 탭에 채워집니다.
- **부분 번역**: 이미 번역된 글을 수정할 때가 핵심입니다. 한 문단만 고쳤는데 전체를 다시 번역하면 시간 낭비이고, 이전에 수동으로 다듬은 영문도 날아갑니다. **수정한 부분만 드래그해서 번역 버튼을 누르면**, 주변 문맥(앞뒤 150자)을 참고하여 선택 영역만 번역하고 그 자리에 교체합니다. 나머지 영문은 그대로 유지됩니다.

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
