# Personal Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js App Router 기반 개인 블로그 구축 (한/영 지원, SSR, 마크다운 에디터, Notion Academy 스타일)

**Architecture:** App Router + Server Actions로 CRUD 처리. Drizzle + SQLite로 데이터 관리. MinIO에 이미지 저장. JWT로 어드민 인증. OpenAI API로 자동 번역.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, SQLite (better-sqlite3), MinIO (S3 SDK), @uiw/react-md-editor, react-markdown, rehype-pretty-code + Shiki, next-intl, next-themes, Tailwind CSS, Docker

---

## File Structure

```
my-own-blog/
├── docker-compose.yml
├── docker-compose.prod.yml
├── Dockerfile
├── .github/workflows/deploy.yml
├── .env.example
├── drizzle.config.ts
├── tailwind.config.ts
├── next.config.ts
├── middleware.ts                          # JWT 검증, /my/* 보호
├── src/
│   ├── db/
│   │   ├── index.ts                      # Drizzle client 초기화
│   │   ├── schema.ts                     # 모든 테이블 스키마
│   │   └── seed.ts                       # 초기 settings 데이터
│   ├── lib/
│   │   ├── auth.ts                       # JWT 생성/검증/리프레시
│   │   ├── minio.ts                      # MinIO client, upload/delete
│   │   ├── translate.ts                  # OpenAI 번역
│   │   ├── slug.ts                       # 슬러그 생성
│   │   ├── markdown.ts                   # 이미지 URL 파싱 유틸
│   │   └── password.ts                   # bcrypt hash/verify
│   ├── actions/
│   │   ├── auth.ts                       # login/logout server actions
│   │   ├── posts.ts                      # CRUD + 발행 + 번역
│   │   ├── comments.ts                   # 댓글 CRUD
│   │   ├── settings.ts                   # settings CRUD
│   │   ├── categories.ts                 # 카테고리 CRUD
│   │   ├── tags.ts                       # 태그 CRUD
│   │   └── upload.ts                     # 이미지 업로드
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx                # 네비게이션, 검색, 언어/테마 토글
│   │   │   ├── Footer.tsx
│   │   │   └── MobileMenu.tsx            # 햄버거 메뉴
│   │   ├── blog/
│   │   │   ├── PostCard.tsx              # 카드 컴포넌트 (썸네일 or 제목)
│   │   │   ├── PostGrid.tsx              # 카드 그리드
│   │   │   ├── HeroSection.tsx           # 히어로
│   │   │   ├── TableOfContents.tsx       # 목차 사이드바
│   │   │   ├── MarkdownRenderer.tsx      # 마크다운 → HTML 렌더링
│   │   │   ├── CommentSection.tsx        # 댓글 목록 + 입력
│   │   │   ├── CommentItem.tsx           # 개별 댓글
│   │   │   └── FilterBar.tsx             # 카테고리/태그 필터
│   │   ├── admin/
│   │   │   ├── PostEditor.tsx            # 마크다운 에디터 래퍼
│   │   │   ├── ImageSelector.tsx         # 대표이미지 선택
│   │   │   ├── TagInput.tsx              # 태그 입력 (자동완성 + 한/영 입력)
│   │   │   ├── CategorySelect.tsx        # 카테고리 드롭다운
│   │   │   ├── SlugInput.tsx             # 슬러그 입력 (자동생성 + 수정)
│   │   │   └── TranslationEditor.tsx     # 번역본 확인/수정
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── SearchBar.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── LanguageToggle.tsx
│   ├── i18n/
│   │   ├── config.ts                     # next-intl 설정
│   │   ├── provider.tsx                  # localStorage 기반 언어 provider
│   │   └── messages/
│   │       ├── ko.json
│   │       └── en.json
│   └── app/
│       ├── layout.tsx                    # 루트 레이아웃 (ThemeProvider, i18n)
│       ├── page.tsx                      # 메인 (히어로 + 카드 그리드)
│       ├── post/[slug]/page.tsx          # 글 상세
│       ├── category/[slug]/page.tsx      # 카테고리별 목록
│       ├── tag/[slug]/page.tsx           # 태그별 목록
│       ├── search/page.tsx               # 검색 결과
│       ├── api/upload/route.ts           # 이미지 업로드 API (에디터용)
│       └── my/
│           ├── layout.tsx                # 어드민 레이아웃
│           ├── page.tsx                  # 대시보드
│           ├── write/page.tsx            # 글 작성/수정
│           ├── settings/page.tsx         # 설정
│           └── login/page.tsx            # 로그인
└── tests/
    ├── lib/
    │   ├── auth.test.ts
    │   ├── slug.test.ts
    │   ├── markdown.test.ts
    │   └── password.test.ts
    ├── actions/
    │   ├── posts.test.ts
    │   └── comments.test.ts
    └── db/
        └── schema.test.ts
```

---

## Task 1: Project Scaffolding + Docker

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.env.example`, `.env.local`, `.gitignore`, `docker-compose.yml`, `Dockerfile`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /home/rheon/Desktop/projects/my-own-blog
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the base Next.js project with App Router, TypeScript, Tailwind.

- [ ] **Step 2: Install core dependencies**

```bash
npm install drizzle-orm better-sqlite3 @aws-sdk/client-s3 @uiw/react-md-editor react-markdown rehype-pretty-code shiki rehype-raw remark-gfm next-intl next-themes jsonwebtoken bcryptjs openai
npm install -D drizzle-kit @types/better-sqlite3 @types/jsonwebtoken @types/bcryptjs vitest @vitejs/plugin-react
```

- [ ] **Step 3: Create .env.example**

```bash
# .env.example
ADMIN_ID=admin
ADMIN_PASSWORD=changeme
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=blog
MINIO_USE_SSL=false
OPENAI_API_KEY=sk-xxx
DATABASE_PATH=./data/blog.db
```

Copy to `.env.local` with actual dev values.

- [ ] **Step 4: Create Docker Compose for development**

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - ./data:/app/data
    env_file: .env.local
    depends_on:
      - minio

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"

volumes:
  minio_data:
```

- [ ] **Step 5: Create Dockerfile**

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dev stage
FROM base AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 6: Update next.config.ts for standalone output**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 7: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

- [ ] **Step 8: Create .gitignore additions**

Append to existing `.gitignore`:

```
data/
.env.local
```

- [ ] **Step 9: Init git and commit**

```bash
git init
git add -A
git commit -m "chore: initialize Next.js project with Docker setup"
```

---

## Task 2: Database Schema + Drizzle Setup

**Files:**
- Create: `src/db/schema.ts`, `src/db/index.ts`, `src/db/seed.ts`, `drizzle.config.ts`
- Test: `tests/db/schema.test.ts`

- [ ] **Step 1: Write schema test**

```typescript
// tests/db/schema.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

function createTestDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./drizzle" });
  return db;
}

describe("schema", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it("should insert and query a post", () => {
    const cat = db.insert(schema.categories).values({
      name: "개발", name_en: "Development", slug: "dev",
    }).returning().get();

    const post = db.insert(schema.posts).values({
      title: "테스트", slug: "test", content: "# Hello",
      categoryId: cat.id,
    }).returning().get();

    expect(post.title).toBe("테스트");
    expect(post.isPublished).toBe(false);
    expect(post.viewCount).toBe(0);
  });

  it("should insert tags and link to post via post_tags", () => {
    const cat = db.insert(schema.categories).values({
      name: "개발", name_en: "Dev", slug: "dev",
    }).returning().get();

    const post = db.insert(schema.posts).values({
      title: "테스트", slug: "test", content: "hello",
      categoryId: cat.id,
    }).returning().get();

    const tag = db.insert(schema.tags).values({
      name: "Next.js", nameEn: "Next.js",
    }).returning().get();

    db.insert(schema.postTags).values({
      postId: post.id, tagId: tag.id,
    }).run();

    const linked = db.select().from(schema.postTags)
      .where(eq(schema.postTags.postId, post.id)).all();
    expect(linked).toHaveLength(1);
  });

  it("should insert comment with parent_id for reply", () => {
    const cat = db.insert(schema.categories).values({
      name: "개발", name_en: "Dev", slug: "dev",
    }).returning().get();

    const post = db.insert(schema.posts).values({
      title: "테스트", slug: "test", content: "hello",
      categoryId: cat.id,
    }).returning().get();

    const comment = db.insert(schema.comments).values({
      postId: post.id, nickname: "user1",
      password: "hashed", content: "좋은 글이네요",
    }).returning().get();

    const reply = db.insert(schema.comments).values({
      postId: post.id, parentId: comment.id,
      nickname: "user2", password: "hashed", content: "감사합니다",
    }).returning().get();

    expect(reply.parentId).toBe(comment.id);
  });

  it("should insert and query settings", () => {
    db.insert(schema.settings).values({
      key: "blog_title", value: JSON.stringify("My Blog"),
    }).run();

    const setting = db.select().from(schema.settings)
      .where(eq(schema.settings.key, "blog_title")).get();
    expect(JSON.parse(setting!.value)).toBe("My Blog");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/db/schema.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create drizzle config**

```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH || "./data/blog.db",
  },
} satisfies Config;
```

- [ ] **Step 4: Create schema**

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  contentEn: text("content_en"),
  thumbnail: text("thumbnail"),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
});

export const postTags = sqliteTable("post_tags", {
  postId: integer("post_id").notNull().references(() => posts.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => posts.id),
  parentId: integer("parent_id"),
  nickname: text("nickname").notNull(),
  password: text("password").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
```

- [ ] **Step 5: Create db client**

```typescript
// src/db/index.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH || "./data/blog.db";
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 6: Generate and run migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

- [ ] **Step 7: Create seed script**

```typescript
// src/db/seed.ts
import { db } from "./index";
import { settings, categories } from "./schema";

const defaultSettings = [
  { key: "blog_title", value: JSON.stringify("My Blog") },
  { key: "blog_title_en", value: JSON.stringify("My Blog") },
  { key: "hero_title", value: JSON.stringify("Welcome") },
  { key: "hero_subtitle", value: JSON.stringify("개발 블로그입니다") },
  { key: "hero_title_en", value: JSON.stringify("Welcome") },
  { key: "hero_subtitle_en", value: JSON.stringify("A dev blog") },
  { key: "show_view_count", value: JSON.stringify(true) },
];

for (const s of defaultSettings) {
  db.insert(settings).values(s).onConflictDoNothing().run();
}

db.insert(categories).values({
  name: "미분류", nameEn: "Uncategorized", slug: "uncategorized",
}).onConflictDoNothing().run();

console.log("Seed complete");
```

Add to `package.json` scripts: `"db:seed": "npx tsx src/db/seed.ts"`

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/db/schema.test.ts
```

Expected: ALL PASS

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add database schema with Drizzle + SQLite"
```

---

## Task 3: Auth Library + Middleware

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/password.ts`, `middleware.ts`
- Test: `tests/lib/auth.test.ts`, `tests/lib/password.test.ts`

- [ ] **Step 1: Write password test**

```typescript
// tests/lib/password.test.ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("should hash and verify password", async () => {
    const hash = await hashPassword("test123");
    expect(hash).not.toBe("test123");
    expect(await verifyPassword("test123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/password.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement password lib**

```typescript
// src/lib/password.ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 4: Run password test**

```bash
npx vitest run tests/lib/password.test.ts
```

Expected: PASS

- [ ] **Step 5: Write auth test**

```typescript
// tests/lib/auth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-chars-long");
vi.stubEnv("JWT_REFRESH_SECRET", "test-refresh-secret-at-least-32-chars");

import { createTokens, verifyAccessToken, verifyRefreshToken } from "@/lib/auth";

describe("auth", () => {
  it("should create and verify access token", () => {
    const { accessToken } = createTokens("admin");
    const payload = verifyAccessToken(accessToken);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("admin");
  });

  it("should create and verify refresh token", () => {
    const { refreshToken } = createTokens("admin");
    const payload = verifyRefreshToken(refreshToken);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("admin");
  });

  it("should reject invalid token", () => {
    const payload = verifyAccessToken("invalid-token");
    expect(payload).toBeNull();
  });

  it("should reject expired access token", () => {
    vi.useFakeTimers();
    const { accessToken } = createTokens("admin");
    vi.advanceTimersByTime(16 * 60 * 1000); // 16 minutes (access = 15min)
    const payload = verifyAccessToken(accessToken);
    expect(payload).toBeNull();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run tests/lib/auth.test.ts
```

Expected: FAIL

- [ ] **Step 7: Implement auth lib**

```typescript
// src/lib/auth.ts
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

interface TokenPayload {
  userId: string;
}

export function createTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookies(userId: string) {
  const { accessToken, refreshToken } = createTokens(userId);
  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}
```

- [ ] **Step 8: Run auth test**

```bash
npx vitest run tests/lib/auth.test.ts
```

Expected: PASS

- [ ] **Step 9: Create middleware**

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /my/login은 보호 안 함
  if (pathname === "/my/login") {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // access token 검증
  if (accessToken) {
    try {
      jwt.verify(accessToken, process.env.JWT_SECRET!);
      return NextResponse.next();
    } catch {
      // access 만료 — refresh 시도
    }
  }

  // refresh token으로 자동 갱신
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
      const newAccessToken = jwt.sign(
        { userId: payload.userId },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" }
      );

      const response = NextResponse.next();
      response.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });
      return response;
    } catch {
      // refresh도 만료
    }
  }

  // 둘 다 실패 → 로그인으로
  return NextResponse.redirect(new URL("/my/login", request.url));
}

export const config = {
  matcher: "/my/:path((?!login).*)",
};
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add JWT auth with auto-refresh and middleware"
```

---

## Task 4: MinIO Client + Image Upload

**Files:**
- Create: `src/lib/minio.ts`, `src/lib/markdown.ts`, `src/app/api/upload/route.ts`
- Test: `tests/lib/markdown.test.ts`

- [ ] **Step 1: Write markdown image parser test**

```typescript
// tests/lib/markdown.test.ts
import { describe, it, expect } from "vitest";
import { extractImageUrls } from "@/lib/markdown";

describe("extractImageUrls", () => {
  it("should extract image URLs from markdown", () => {
    const md = `
# Hello
![alt](https://minio.example.com/blog/img1.png)
some text
![](https://minio.example.com/blog/img2.jpg)
    `;
    const urls = extractImageUrls(md);
    expect(urls).toEqual([
      "https://minio.example.com/blog/img1.png",
      "https://minio.example.com/blog/img2.jpg",
    ]);
  });

  it("should return empty array for no images", () => {
    expect(extractImageUrls("# Just text")).toEqual([]);
  });

  it("should ignore non-image links", () => {
    const md = "[link](https://example.com)";
    expect(extractImageUrls(md)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/markdown.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement markdown util**

```typescript
// src/lib/markdown.ts
export function extractImageUrls(markdown: string): string[] {
  const regex = /!\[.*?\]\((.*?)\)/g;
  const urls: string[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}
```

- [ ] **Step 4: Run test**

```bash
npx vitest run tests/lib/markdown.test.ts
```

Expected: PASS

- [ ] **Step 5: Create MinIO client**

```typescript
// src/lib/minio.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

const s3 = new S3Client({
  endpoint: `http${process.env.MINIO_USE_SSL === "true" ? "s" : ""}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET!;

export async function uploadImage(file: Buffer, originalName: string, contentType: string): Promise<string> {
  const ext = path.extname(originalName);
  const key = `images/${randomUUID()}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
  }));

  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  return `${protocol}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET}/${key}`;
}

export async function deleteImage(url: string): Promise<void> {
  const urlObj = new URL(url);
  const key = urlObj.pathname.replace(`/${BUCKET}/`, "");

  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

export async function deleteImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(deleteImage));
}
```

- [ ] **Step 6: Create upload API route**

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/minio";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // 인증 확인
  const token = request.cookies.get("access_token")?.value;
  if (!token || !verifyAccessToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadImage(buffer, file.name, file.type);

  return NextResponse.json({ url });
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add MinIO image upload and markdown image parser"
```

---

## Task 5: Slug Generation

**Files:**
- Create: `src/lib/slug.ts`
- Test: `tests/lib/slug.test.ts`

- [ ] **Step 1: Write slug test**

```typescript
// tests/lib/slug.test.ts
import { describe, it, expect } from "vitest";
import { generateSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("should convert english to slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("should handle korean by romanizing or stripping", () => {
    const slug = generateSlug("Next.js 블로그 만들기");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug.length).toBeGreaterThan(0);
  });

  it("should remove special characters", () => {
    expect(generateSlug("Hello! @World#")).toBe("hello-world");
  });

  it("should trim leading/trailing hyphens", () => {
    expect(generateSlug("--hello--")).toBe("hello");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/lib/slug.test.ts
```

Expected: FAIL

- [ ] **Step 3: Install transliteration lib and implement**

```bash
npm install transliteration
```

```typescript
// src/lib/slug.ts
import { slugify } from "transliteration";

export function generateSlug(title: string): string {
  return slugify(title, { lowercase: true, separator: "-" })
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 4: Run test**

```bash
npx vitest run tests/lib/slug.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add slug generation with Korean transliteration"
```

---

## Task 6: Translation Service

**Files:**
- Create: `src/lib/translate.ts`

- [ ] **Step 1: Create translate lib**

```typescript
// src/lib/translate.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function translateToEnglish(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a translator. Translate the following Korean text to English. " +
          "Preserve all markdown formatting, code blocks, and links exactly as they are. " +
          "Only translate the natural language text. Return only the translated text.",
      },
      { role: "user", content: text },
    ],
  });

  return response.choices[0].message.content || text;
}

export async function translateTitle(title: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Translate the following Korean title to English. Return only the translated title, nothing else.",
      },
      { role: "user", content: title },
    ],
  });

  return response.choices[0].message.content || title;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add OpenAI translation service"
```

---

## Task 7: Server Actions — Auth

**Files:**
- Create: `src/actions/auth.ts`

- [ ] **Step 1: Create auth actions**

```typescript
// src/actions/auth.ts
"use server";

import { setAuthCookies, clearAuthCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const id = formData.get("id") as string;
  const password = formData.get("password") as string;

  if (id !== process.env.ADMIN_ID || password !== process.env.ADMIN_PASSWORD) {
    return { error: "아이디 또는 비밀번호가 일치하지 않습니다." };
  }

  await setAuthCookies(id);
  redirect("/my");
}

export async function logout() {
  await clearAuthCookies();
  redirect("/my/login");
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add auth server actions"
```

---

## Task 8: Server Actions — Settings

**Files:**
- Create: `src/actions/settings.ts`

- [ ] **Step 1: Create settings actions**

```typescript
// src/actions/settings.ts
"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSetting(key: string): Promise<string | null> {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row ? JSON.parse(row.value) : null;
}

export async function getSettings(): Promise<Record<string, unknown>> {
  const rows = db.select().from(settings).all();
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.key] = JSON.parse(row.value);
  }
  return result;
}

export async function updateSetting(formData: FormData) {
  const key = formData.get("key") as string;
  const value = formData.get("value") as string;

  db.insert(settings)
    .values({ key, value: JSON.stringify(value) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value) } })
    .run();

  revalidatePath("/");
  revalidatePath("/my/settings");
}

export async function updateSettings(data: Record<string, unknown>) {
  for (const [key, value] of Object.entries(data)) {
    db.insert(settings)
      .values({ key, value: JSON.stringify(value) })
      .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value) } })
      .run();
  }

  revalidatePath("/");
  revalidatePath("/my/settings");
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add settings server actions"
```

---

## Task 9: Server Actions — Categories & Tags

**Files:**
- Create: `src/actions/categories.ts`, `src/actions/tags.ts`

- [ ] **Step 1: Create category actions**

```typescript
// src/actions/categories.ts
"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";

export async function getCategories() {
  return db.select().from(categories).all();
}

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const nameEn = formData.get("nameEn") as string;
  const slug = generateSlug(nameEn);

  db.insert(categories).values({ name, nameEn, slug }).run();
  revalidatePath("/my/settings");
  revalidatePath("/");
}

export async function deleteCategory(id: number) {
  db.delete(categories).where(eq(categories.id, id)).run();
  revalidatePath("/my/settings");
  revalidatePath("/");
}
```

- [ ] **Step 2: Create tag actions**

```typescript
// src/actions/tags.ts
"use server";

import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTags() {
  return db.select().from(tags).all();
}

export async function searchTags(query: string) {
  return db.select().from(tags)
    .where(like(tags.name, `%${query}%`))
    .limit(10)
    .all();
}

export async function createTag(name: string, nameEn: string) {
  return db.insert(tags).values({ name, nameEn }).returning().get();
}

export async function deleteTag(id: number) {
  db.delete(tags).where(eq(tags.id, id)).run();
  revalidatePath("/my/settings");
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add category and tag server actions"
```

---

## Task 10: Server Actions — Posts

**Files:**
- Create: `src/actions/posts.ts`
- Test: `tests/actions/posts.test.ts`

- [ ] **Step 1: Write post actions test**

```typescript
// tests/actions/posts.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db for unit testing the image cleanup logic
vi.mock("@/db", () => {
  return { db: {} };
});

import { getOrphanedImages } from "@/actions/posts";

describe("getOrphanedImages", () => {
  it("should detect removed images", () => {
    const oldContent = "![](http://minio/blog/images/a.png) ![](http://minio/blog/images/b.png)";
    const newContent = "![](http://minio/blog/images/a.png)";
    const oldThumbnail = null;
    const newThumbnail = null;

    const orphaned = getOrphanedImages(oldContent, newContent, oldThumbnail, newThumbnail);
    expect(orphaned).toEqual(["http://minio/blog/images/b.png"]);
  });

  it("should detect removed thumbnail", () => {
    const oldContent = "";
    const newContent = "";
    const oldThumbnail = "http://minio/blog/images/thumb.png";
    const newThumbnail = null;

    const orphaned = getOrphanedImages(oldContent, newContent, oldThumbnail, newThumbnail);
    expect(orphaned).toEqual(["http://minio/blog/images/thumb.png"]);
  });

  it("should return empty when no images removed", () => {
    const content = "![](http://minio/blog/images/a.png)";
    const orphaned = getOrphanedImages(content, content, null, null);
    expect(orphaned).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/actions/posts.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create post actions**

```typescript
// src/actions/posts.ts
"use server";

import { db } from "@/db";
import { posts, postTags, tags } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";
import { extractImageUrls } from "@/lib/markdown";
import { deleteImages } from "@/lib/minio";
import { translateToEnglish, translateTitle } from "@/lib/translate";

// Exported for testing
export function getOrphanedImages(
  oldContent: string,
  newContent: string,
  oldThumbnail: string | null,
  newThumbnail: string | null
): string[] {
  const oldUrls = new Set([
    ...extractImageUrls(oldContent),
    ...(oldThumbnail ? [oldThumbnail] : []),
  ]);
  const newUrls = new Set([
    ...extractImageUrls(newContent),
    ...(newThumbnail ? [newThumbnail] : []),
  ]);

  return [...oldUrls].filter((url) => !newUrls.has(url));
}

export async function getPosts(options?: {
  published?: boolean;
  categoryId?: number;
  tagId?: number;
  limit?: number;
  offset?: number;
}) {
  let query = db.select().from(posts).orderBy(desc(posts.createdAt));

  const conditions = [];
  if (options?.published !== undefined) {
    conditions.push(eq(posts.isPublished, options.published));
  }
  if (options?.categoryId) {
    conditions.push(eq(posts.categoryId, options.categoryId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  if (options?.limit) {
    query = query.limit(options.limit) as typeof query;
  }
  if (options?.offset) {
    query = query.offset(options.offset) as typeof query;
  }

  return query.all();
}

export async function getPostBySlug(slug: string) {
  return db.select().from(posts).where(eq(posts.slug, slug)).get();
}

export async function getPostById(id: number) {
  return db.select().from(posts).where(eq(posts.id, id)).get();
}

export async function getPostTags(postId: number) {
  return db
    .select({ id: tags.id, name: tags.name, nameEn: tags.nameEn })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .all();
}

export async function savePost(formData: FormData) {
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const categoryId = Number(formData.get("categoryId"));
  const thumbnail = (formData.get("thumbnail") as string) || null;
  const slug = (formData.get("slug") as string) || generateSlug(title);
  const tagIds = JSON.parse((formData.get("tagIds") as string) || "[]") as number[];
  const publish = formData.get("publish") === "true";

  let postId: number;

  if (id) {
    // 수정 — 고아 이미지 정리
    const existing = db.select().from(posts).where(eq(posts.id, id)).get();
    if (existing) {
      const orphaned = getOrphanedImages(existing.content, content, existing.thumbnail, thumbnail);
      if (orphaned.length > 0) {
        await deleteImages(orphaned);
      }
    }

    db.update(posts)
      .set({
        title,
        content,
        categoryId,
        thumbnail,
        slug,
        isPublished: publish ? true : undefined,
        updatedAt: sql`datetime('now')`,
      })
      .where(eq(posts.id, id))
      .run();
    postId = id;
  } else {
    // 새 글
    const result = db
      .insert(posts)
      .values({
        title,
        content,
        categoryId,
        thumbnail,
        slug,
        isPublished: publish,
      })
      .returning()
      .get();
    postId = result.id;
  }

  // 태그 연결 갱신
  db.delete(postTags).where(eq(postTags.postId, postId)).run();
  for (const tagId of tagIds) {
    db.insert(postTags).values({ postId, tagId }).run();
  }

  // 발행 시 번역
  if (publish) {
    const titleEn = await translateTitle(title);
    const contentEn = await translateToEnglish(content);
    db.update(posts)
      .set({ titleEn, contentEn })
      .where(eq(posts.id, postId))
      .run();
  }

  revalidatePath("/");
  revalidatePath(`/post/${slug}`);
  revalidatePath("/my");

  return { postId, slug };
}

export async function updateTranslation(formData: FormData) {
  const id = Number(formData.get("id"));
  const titleEn = formData.get("titleEn") as string;
  const contentEn = formData.get("contentEn") as string;

  db.update(posts)
    .set({ titleEn, contentEn, updatedAt: sql`datetime('now')` })
    .where(eq(posts.id, id))
    .run();

  const post = db.select().from(posts).where(eq(posts.id, id)).get();
  revalidatePath(`/post/${post?.slug}`);
  revalidatePath("/my");
}

export async function deletePost(id: number) {
  const post = db.select().from(posts).where(eq(posts.id, id)).get();
  if (post) {
    // 이미지 정리
    const imageUrls = extractImageUrls(post.content);
    if (post.thumbnail) imageUrls.push(post.thumbnail);
    if (imageUrls.length > 0) {
      await deleteImages(imageUrls);
    }

    db.delete(postTags).where(eq(postTags.postId, id)).run();
    db.delete(posts).where(eq(posts.id, id)).run();
  }

  revalidatePath("/");
  revalidatePath("/my");
}

export async function incrementViewCount(slug: string) {
  db.update(posts)
    .set({ viewCount: sql`view_count + 1` })
    .where(eq(posts.slug, slug))
    .run();
}
```

- [ ] **Step 4: Run test**

```bash
npx vitest run tests/actions/posts.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add post server actions with image cleanup"
```

---

## Task 11: Server Actions — Comments

**Files:**
- Create: `src/actions/comments.ts`

- [ ] **Step 1: Create comment actions**

```typescript
// src/actions/comments.ts
"use server";

import { db } from "@/db";
import { comments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function getComments(postId: number) {
  return db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt)
    .all();
}

export async function createComment(formData: FormData) {
  const postId = Number(formData.get("postId"));
  const parentId = formData.get("parentId") ? Number(formData.get("parentId")) : null;
  const nickname = formData.get("nickname") as string;
  const password = formData.get("password") as string;
  const content = formData.get("content") as string;
  const slug = formData.get("slug") as string;

  const hashedPw = await hashPassword(password);

  db.insert(comments)
    .values({
      postId,
      parentId,
      nickname,
      password: hashedPw,
      content,
    })
    .run();

  revalidatePath(`/post/${slug}`);
}

export async function deleteComment(formData: FormData) {
  const commentId = Number(formData.get("commentId"));
  const password = formData.get("password") as string;
  const slug = formData.get("slug") as string;

  const comment = db.select().from(comments).where(eq(comments.id, commentId)).get();
  if (!comment) return { error: "댓글을 찾을 수 없습니다." };

  const valid = await verifyPassword(password, comment.password);
  if (!valid) return { error: "비밀번호가 일치하지 않습니다." };

  db.update(comments)
    .set({ isDeleted: true })
    .where(eq(comments.id, commentId))
    .run();

  revalidatePath(`/post/${slug}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add comment server actions"
```

---

## Task 12: Search with FTS5

**Files:**
- Create: `src/actions/search.ts`
- Modify: `src/db/index.ts` (FTS5 테이블 생성)

- [ ] **Step 1: Add FTS5 setup to db/index.ts**

Append to `src/db/index.ts`:

```typescript
// FTS5 virtual table for full-text search
sqlite.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
    title, content, title_en, content_en,
    content='posts',
    content_rowid='id'
  );

  CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
    INSERT INTO posts_fts(rowid, title, content, title_en, content_en)
    VALUES (new.id, new.title, new.content, new.title_en, new.content_en);
  END;

  CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, content, title_en, content_en)
    VALUES ('delete', old.id, old.title, old.content, old.title_en, old.content_en);
  END;

  CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, content, title_en, content_en)
    VALUES ('delete', old.id, old.title, old.content, old.title_en, old.content_en);
    INSERT INTO posts_fts(rowid, title, content, title_en, content_en)
    VALUES (new.id, new.title, new.content, new.title_en, new.content_en);
  END;
`);
```

- [ ] **Step 2: Create search action**

```typescript
// src/actions/search.ts
"use server";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, sql, and, inArray } from "drizzle-orm";

export async function searchPosts(query: string, locale: string = "ko") {
  if (!query.trim()) return [];

  const ftsColumn = locale === "en" ? "title_en, content_en" : "title, content";
  const escapedQuery = query.replace(/['"]/g, "");

  // FTS5 search
  const ftsResults = db.all(sql`
    SELECT rowid FROM posts_fts
    WHERE posts_fts MATCH ${escapedQuery}
    ORDER BY rank
    LIMIT 20
  `) as { rowid: number }[];

  if (ftsResults.length === 0) return [];

  const ids = ftsResults.map((r) => r.rowid);
  return db
    .select()
    .from(posts)
    .where(and(inArray(posts.id, ids), eq(posts.isPublished, true)))
    .all();
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add full-text search with SQLite FTS5"
```

---

## Task 13: i18n Setup

**Files:**
- Create: `src/i18n/config.ts`, `src/i18n/provider.tsx`, `src/i18n/messages/ko.json`, `src/i18n/messages/en.json`

- [ ] **Step 1: Create message files**

```json
// src/i18n/messages/ko.json
{
  "nav": {
    "home": "홈",
    "search": "검색",
    "categories": "카테고리",
    "tags": "태그"
  },
  "hero": {
    "allPosts": "모든 글",
    "latestPosts": "최신 글"
  },
  "post": {
    "viewCount": "조회수",
    "publishedAt": "작성일",
    "tableOfContents": "목차"
  },
  "comment": {
    "title": "댓글",
    "nickname": "닉네임",
    "password": "비밀번호",
    "content": "내용",
    "submit": "댓글 작성",
    "reply": "답글",
    "delete": "삭제",
    "deleted": "삭제된 댓글입니다.",
    "confirmDelete": "비밀번호를 입력하세요"
  },
  "search": {
    "placeholder": "검색어를 입력하세요",
    "noResults": "검색 결과가 없습니다."
  },
  "common": {
    "readMore": "더 보기"
  }
}
```

```json
// src/i18n/messages/en.json
{
  "nav": {
    "home": "Home",
    "search": "Search",
    "categories": "Categories",
    "tags": "Tags"
  },
  "hero": {
    "allPosts": "All Posts",
    "latestPosts": "Latest Posts"
  },
  "post": {
    "viewCount": "Views",
    "publishedAt": "Published",
    "tableOfContents": "Table of Contents"
  },
  "comment": {
    "title": "Comments",
    "nickname": "Nickname",
    "password": "Password",
    "content": "Content",
    "submit": "Submit",
    "reply": "Reply",
    "delete": "Delete",
    "deleted": "This comment has been deleted.",
    "confirmDelete": "Enter password"
  },
  "search": {
    "placeholder": "Search...",
    "noResults": "No results found."
  },
  "common": {
    "readMore": "Read more"
  }
}
```

- [ ] **Step 2: Create i18n config and provider**

```typescript
// src/i18n/config.ts
export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";
```

```tsx
// src/i18n/provider.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Locale } from "./config";
import ko from "./messages/ko.json";
import en from "./messages/en.json";

const messages = { ko, en } as const;

type Messages = typeof ko;
type NestedKeyOf<T, K extends string = ""> = T extends object
  ? { [P in keyof T & string]: NestedKeyOf<T[P], K extends "" ? P : `${K}.${P}`> }[keyof T & string]
  : K;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && (saved === "ko" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: unknown = messages[locale];
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add i18n with localStorage persistence"
```

---

## Task 14: UI Components (Notion Academy Style)

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/SearchBar.tsx`, `src/components/ui/ThemeToggle.tsx`, `src/components/ui/LanguageToggle.tsx`

- [ ] **Step 1: Configure Tailwind theme**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          card: "var(--bg-card)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        border: {
          DEFAULT: "var(--border-color)",
        },
        accent: "var(--accent)",
      },
      maxWidth: {
        content: "1080px",
        prose: "768px",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Add CSS variables to globals.css**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

:root {
  --bg-primary: #ffffff;
  --bg-card: #f7f6f3;
  --text-primary: #37352f;
  --text-secondary: #6b6b6b;
  --border-color: #e0e0e0;
  --accent: #2383e2;
}

.dark {
  --bg-primary: #191919;
  --bg-card: #2f2f2f;
  --text-primary: #e0e0e0;
  --text-secondary: #9b9b9b;
  --border-color: #3a3a3a;
  --accent: #529cca;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: "Pretendard Variable", Pretendard, sans-serif;
}
```

- [ ] **Step 3: Create UI components**

```tsx
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined";
}

export function Button({ variant = "filled", className = "", children, ...props }: ButtonProps) {
  const base = "px-5 py-2.5 rounded-full text-sm font-medium transition-colors";
  const variants = {
    filled: "bg-accent text-white hover:opacity-90",
    outlined: "border border-border text-text-primary hover:bg-bg-card",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
```

```tsx
// src/components/ui/Card.tsx
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "bordered" | "filled";
}

export function Card({ variant = "bordered", className = "", children, ...props }: CardProps) {
  const variants = {
    bordered: "border border-border rounded-xl hover:shadow-sm transition-shadow",
    filled: "bg-bg-card rounded-xl",
  };
  return (
    <div className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
```

```tsx
// src/components/ui/Input.tsx
import { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-2.5 rounded-lg border border-border bg-bg-primary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent ${className}`}
      {...props}
    />
  );
}
```

```tsx
// src/components/ui/SearchBar.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/provider";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search.placeholder")}
        className="w-full px-4 py-2 pl-10 rounded-lg border border-border bg-bg-primary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent text-sm"
      />
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </form>
  );
}
```

```tsx
// src/components/ui/ThemeToggle.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg hover:bg-bg-card transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
```

```tsx
// src/components/ui/LanguageToggle.tsx
"use client";

import { useI18n } from "@/i18n/provider";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-bg-card transition-colors text-text-secondary"
    >
      {locale === "ko" ? "EN" : "한"}
    </button>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add UI components with Notion Academy styling"
```

---

## Task 15: Layout Components (Header, Footer, Mobile Menu)

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/MobileMenu.tsx`

- [ ] **Step 1: Create Header**

```tsx
// src/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { MobileMenu } from "./MobileMenu";
import { useI18n } from "@/i18n/provider";

interface HeaderProps {
  blogTitle: string;
}

export function Header({ blogTitle }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border">
      <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold text-text-primary">
            {blogTitle}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/" className="hover:text-text-primary transition-colors">
              {t("nav.home")}
            </Link>
            <Link href="/search" className="hover:text-text-primary transition-colors">
              {t("nav.search")}
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="w-48">
            <SearchBar />
          </div>
          <LanguageToggle />
          <ThemeToggle />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}
    </header>
  );
}
```

- [ ] **Step 2: Create MobileMenu**

```tsx
// src/components/layout/MobileMenu.tsx
"use client";

import Link from "next/link";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useI18n } from "@/i18n/provider";

interface MobileMenuProps {
  onClose: () => void;
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const { t } = useI18n();

  return (
    <div className="md:hidden border-t border-border bg-bg-primary px-6 py-4 space-y-4">
      <SearchBar />
      <nav className="flex flex-col gap-3 text-sm">
        <Link href="/" onClick={onClose} className="text-text-secondary hover:text-text-primary">
          {t("nav.home")}
        </Link>
        <Link href="/search" onClick={onClose} className="text-text-secondary hover:text-text-primary">
          {t("nav.search")}
        </Link>
      </nav>
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Footer**

```tsx
// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-content mx-auto px-6 py-12 text-center text-sm text-text-secondary">
        <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add layout components (Header, Footer, MobileMenu)"
```

---

## Task 16: Root Layout + Theme + i18n Providers

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/i18n/provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

// 서버에서 settings 가져오기
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

function getBlogTitle(): string {
  const row = db.select().from(settings).where(eq(settings.key, "blog_title")).get();
  return row ? JSON.parse(row.value) : "My Blog";
}

export const metadata: Metadata = {
  title: "My Blog",
  description: "A personal blog",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const blogTitle = getBlogTitle();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <I18nProvider>
            <Header blogTitle={blogTitle} />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create placeholder home page**

```tsx
// src/app/page.tsx
export default function Home() {
  return (
    <div className="max-w-content mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold">Welcome</h1>
      <p className="mt-4 text-text-secondary">Blog is under construction.</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify dev server runs**

```bash
npm run dev
```

Visit `http://localhost:3000` — should see header, placeholder page, footer. Theme toggle and language toggle should work.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add root layout with theme and i18n providers"
```

---

## Task 17: Admin Login Page

**Files:**
- Create: `src/app/my/login/page.tsx`

- [ ] **Step 1: Create login page**

```tsx
// src/app/my/login/page.tsx
"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
        <form action={formAction} className="space-y-4">
          <Input name="id" type="text" placeholder="ID" required />
          <Input name="password" type="password" placeholder="Password" required />
          {state?.error && (
            <p className="text-red-500 text-sm">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create admin layout**

```tsx
// src/app/my/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Verify login flow**

Visit `http://localhost:3000/my` — should redirect to `/my/login`. Enter credentials — should redirect to `/my`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add admin login page"
```

---

## Task 18: Admin Dashboard

**Files:**
- Create: `src/app/my/page.tsx`

- [ ] **Step 1: Create dashboard**

```tsx
// src/app/my/page.tsx
import Link from "next/link";
import { getPosts } from "@/actions/posts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function DashboardPage() {
  const allPosts = await getPosts();
  const published = allPosts.filter((p) => p.isPublished);
  const drafts = allPosts.filter((p) => !p.isPublished);
  const totalViews = allPosts.reduce((sum, p) => sum + p.viewCount, 0);

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/my/write">
          <Button>새 글 작성</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Card variant="filled" className="p-6">
          <p className="text-sm text-text-secondary">발행된 글</p>
          <p className="text-3xl font-bold mt-1">{published.length}</p>
        </Card>
        <Card variant="filled" className="p-6">
          <p className="text-sm text-text-secondary">임시저장</p>
          <p className="text-3xl font-bold mt-1">{drafts.length}</p>
        </Card>
        <Card variant="filled" className="p-6">
          <p className="text-sm text-text-secondary">총 조회수</p>
          <p className="text-3xl font-bold mt-1">{totalViews.toLocaleString()}</p>
        </Card>
      </div>

      {/* Post list */}
      <h2 className="text-lg font-bold mb-4">모든 글</h2>
      <div className="space-y-3">
        {allPosts.map((post) => (
          <Card key={post.id} className="p-4 flex items-center justify-between">
            <div>
              <Link
                href={`/my/write?id=${post.id}`}
                className="font-medium hover:text-accent transition-colors"
              >
                {post.title}
              </Link>
              <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                <span>{post.isPublished ? "발행됨" : "임시저장"}</span>
                <span>조회수 {post.viewCount}</span>
                <span>{post.createdAt}</span>
              </div>
            </div>
          </Card>
        ))}
        {allPosts.length === 0 && (
          <p className="text-text-secondary text-sm">아직 작성된 글이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add admin dashboard"
```

---

## Task 19: Post Editor Page (Write/Edit)

**Files:**
- Create: `src/app/my/write/page.tsx`, `src/components/admin/PostEditor.tsx`, `src/components/admin/ImageSelector.tsx`, `src/components/admin/TagInput.tsx`, `src/components/admin/CategorySelect.tsx`, `src/components/admin/SlugInput.tsx`, `src/components/admin/TranslationEditor.tsx`

- [ ] **Step 1: Create CategorySelect**

```tsx
// src/components/admin/CategorySelect.tsx
"use client";

interface Category {
  id: number;
  name: string;
  nameEn: string;
  slug: string;
}

interface CategorySelectProps {
  categories: Category[];
  value: number | null;
  onChange: (id: number) => void;
}

export function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="px-4 py-2.5 rounded-lg border border-border bg-bg-primary text-text-primary text-sm"
    >
      <option value="" disabled>카테고리 선택</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Create TagInput**

```tsx
// src/components/admin/TagInput.tsx
"use client";

import { useState } from "react";
import { searchTags, createTag } from "@/actions/tags";

interface Tag {
  id: number;
  name: string;
  nameEn: string;
}

interface TagInputProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

export function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [query, setQuery] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length > 0) {
      const results = await searchTags(value);
      setSuggestions(results.filter((t) => !selectedTags.some((s) => s.id === t.id)));
    } else {
      setSuggestions([]);
    }
  };

  const addTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setQuery("");
    setSuggestions([]);
  };

  const removeTag = (id: number) => {
    onChange(selectedTags.filter((t) => t.id !== id));
  };

  const handleCreate = async () => {
    if (!query.trim() || !nameEn.trim()) return;
    const tag = await createTag(query.trim(), nameEn.trim());
    addTag(tag);
    setNameEn("");
    setShowNewForm(false);
  };

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span key={tag.id} className="inline-flex items-center gap-1 px-3 py-1 bg-bg-card rounded-full text-sm">
            {tag.name}
            <button onClick={() => removeTag(tag.id)} className="text-text-secondary hover:text-text-primary">&times;</button>
          </span>
        ))}
      </div>

      {/* Search input */}
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="태그 검색 또는 추가"
        className="w-full px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm"
      />

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              onClick={() => addTag(tag)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-bg-card"
            >
              {tag.name} ({tag.nameEn})
            </button>
          ))}
        </div>
      )}

      {/* New tag form */}
      {query.trim() && suggestions.length === 0 && !showNewForm && (
        <button
          onClick={() => setShowNewForm(true)}
          className="text-sm text-accent hover:underline"
        >
          &quot;{query}&quot; 새 태그 만들기
        </button>
      )}

      {showNewForm && (
        <div className="flex gap-2">
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="영문 태그명"
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm"
          />
          <button onClick={handleCreate} className="px-4 py-2 bg-accent text-white rounded-lg text-sm">
            추가
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create SlugInput**

```tsx
// src/components/admin/SlugInput.tsx
"use client";

import { useEffect, useState } from "react";
import { generateSlug } from "@/lib/slug";

interface SlugInputProps {
  title: string;
  value: string;
  onChange: (slug: string) => void;
}

export function SlugInput({ title, value, onChange }: SlugInputProps) {
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (!manual && title) {
      onChange(generateSlug(title));
    }
  }, [title, manual, onChange]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary whitespace-nowrap">/post/</span>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setManual(true);
          onChange(e.target.value);
        }}
        className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg-primary text-sm"
      />
      {manual && (
        <button
          onClick={() => {
            setManual(false);
            onChange(generateSlug(title));
          }}
          className="text-xs text-accent hover:underline whitespace-nowrap"
        >
          자동 생성
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create ImageSelector**

```tsx
// src/components/admin/ImageSelector.tsx
"use client";

interface ImageSelectorProps {
  images: string[];
  thumbnail: string | null;
  onSelect: (url: string | null) => void;
}

export function ImageSelector({ images, thumbnail, onSelect }: ImageSelectorProps) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">대표 이미지 선택</p>
      <div className="grid grid-cols-4 gap-2">
        {images.map((url) => (
          <button
            key={url}
            onClick={() => onSelect(thumbnail === url ? null : url)}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors ${
              thumbnail === url ? "border-accent" : "border-transparent hover:border-border"
            }`}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
            {thumbnail === url && (
              <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                <span className="text-xs font-medium text-white bg-accent px-2 py-1 rounded">대표</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create TranslationEditor**

```tsx
// src/components/admin/TranslationEditor.tsx
"use client";

import { useState } from "react";
import { updateTranslation } from "@/actions/posts";
import { Button } from "@/components/ui/Button";

interface TranslationEditorProps {
  postId: number;
  titleEn: string | null;
  contentEn: string | null;
}

export function TranslationEditor({ postId, titleEn, contentEn }: TranslationEditorProps) {
  const [title, setTitle] = useState(titleEn || "");
  const [content, setContent] = useState(contentEn || "");
  const [saving, setSaving] = useState(false);

  if (!titleEn && !contentEn) return null;

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.set("id", String(postId));
    fd.set("titleEn", title);
    fd.set("contentEn", content);
    await updateTranslation(fd);
    setSaving(false);
  };

  return (
    <div className="space-y-4 border-t border-border pt-6 mt-6">
      <h3 className="text-lg font-bold">영문 번역 수정</h3>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm"
        placeholder="English title"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={15}
        className="w-full px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm font-mono"
        placeholder="English content (markdown)"
      />
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "저장 중..." : "번역 저장"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Create PostEditor (markdown editor wrapper)**

```tsx
// src/components/admin/PostEditor.tsx
"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import type { ContextStore } from "@uiw/react-md-editor";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PostEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export function PostEditor({ value, onChange, onImageUpload }: PostEditorProps) {
  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
          const url = await onImageUpload(file);
          onChange(value + `\n![${file.name}](${url})\n`);
        }
      }
    },
    [value, onChange, onImageUpload]
  );

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const items = event.clipboardData.items;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const url = await onImageUpload(file);
            onChange(value + `\n![image](${url})\n`);
          }
        }
      }
    },
    [value, onChange, onImageUpload]
  );

  return (
    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onPaste={handlePaste}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={500}
        preview="live"
        data-color-mode="auto"
      />
    </div>
  );
}
```

- [ ] **Step 7: Create write page**

```tsx
// src/app/my/write/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { TagInput } from "@/components/admin/TagInput";
import { SlugInput } from "@/components/admin/SlugInput";
import { ImageSelector } from "@/components/admin/ImageSelector";
import { TranslationEditor } from "@/components/admin/TranslationEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getCategories } from "@/actions/categories";
import { getPostById, getPostTags, savePost } from "@/actions/posts";
import { extractImageUrls } from "@/lib/markdown";

interface Tag {
  id: number;
  name: string;
  nameEn: string;
}

export default function WritePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; nameEn: string; slug: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [postTitleEn, setPostTitleEn] = useState<string | null>(null);
  const [postContentEn, setPostContentEn] = useState<string | null>(null);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (editId) {
      getPostById(editId).then((post) => {
        if (post) {
          setTitle(post.title);
          setContent(post.content);
          setSlug(post.slug);
          setCategoryId(post.categoryId);
          setThumbnail(post.thumbnail);
          setPostTitleEn(post.titleEn);
          setPostContentEn(post.contentEn);
        }
      });
      getPostTags(editId).then(setSelectedTags);
    }
  }, [editId]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url;
  };

  const handleSave = async (publish: boolean) => {
    if (!title || !content || !categoryId) return;
    setSaving(true);

    const fd = new FormData();
    if (editId) fd.set("id", String(editId));
    fd.set("title", title);
    fd.set("content", content);
    fd.set("slug", slug);
    fd.set("categoryId", String(categoryId));
    fd.set("thumbnail", thumbnail || "");
    fd.set("tagIds", JSON.stringify(selectedTags.map((t) => t.id)));
    fd.set("publish", String(publish));

    const result = await savePost(fd);
    setSaving(false);
    router.push(`/my/write?id=${result.postId}`);
  };

  const images = extractImageUrls(content);

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{editId ? "글 수정" : "새 글 작성"}</h1>
        <div className="flex gap-2">
          <Button variant="outlined" onClick={() => handleSave(false)} disabled={saving}>
            임시저장
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? "저장 중..." : "발행"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="text-2xl font-bold border-0 border-b rounded-none px-0 focus:border-accent"
        />

        <SlugInput title={title} value={slug} onChange={setSlug} />

        <div className="flex gap-4">
          <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>

        <TagInput selectedTags={selectedTags} onChange={setSelectedTags} />

        <PostEditor value={content} onChange={setContent} onImageUpload={handleImageUpload} />

        <ImageSelector images={images} thumbnail={thumbnail} onSelect={setThumbnail} />

        {editId && postTitleEn && (
          <TranslationEditor postId={editId} titleEn={postTitleEn} contentEn={postContentEn} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add post editor with markdown, image upload, tags, categories"
```

---

## Task 20: Admin Settings Page

**Files:**
- Create: `src/app/my/settings/page.tsx`

- [ ] **Step 1: Create settings page**

```tsx
// src/app/my/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/actions/settings";
import { getCategories, createCategory, deleteCategory } from "@/actions/categories";
import { getTags, deleteTag } from "@/actions/tags";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [categories, setCategories] = useState<{ id: number; name: string; nameEn: string; slug: string }[]>([]);
  const [allTags, setAllTags] = useState<{ id: number; name: string; nameEn: string }[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
    getCategories().then(setCategories);
    getTags().then(setAllTags);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(settings);
    setSaving(false);
  };

  const handleAddCategory = async () => {
    if (!newCatName || !newCatNameEn) return;
    const fd = new FormData();
    fd.set("name", newCatName);
    fd.set("nameEn", newCatNameEn);
    await createCategory(fd);
    setNewCatName("");
    setNewCatNameEn("");
    setCategories(await getCategories());
  };

  const updateField = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-content mx-auto px-6 py-10 space-y-10">
      <h1 className="text-2xl font-bold">설정</h1>

      {/* Blog settings */}
      <Card variant="filled" className="p-6 space-y-4">
        <h2 className="text-lg font-bold">블로그 설정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-secondary">블로그 제목 (한국어)</label>
            <Input value={(settings.blog_title as string) || ""} onChange={(e) => updateField("blog_title", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">블로그 제목 (영문)</label>
            <Input value={(settings.blog_title_en as string) || ""} onChange={(e) => updateField("blog_title_en", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">히어로 제목 (한국어)</label>
            <Input value={(settings.hero_title as string) || ""} onChange={(e) => updateField("hero_title", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">히어로 제목 (영문)</label>
            <Input value={(settings.hero_title_en as string) || ""} onChange={(e) => updateField("hero_title_en", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">히어로 부제 (한국어)</label>
            <Input value={(settings.hero_subtitle as string) || ""} onChange={(e) => updateField("hero_subtitle", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">히어로 부제 (영문)</label>
            <Input value={(settings.hero_subtitle_en as string) || ""} onChange={(e) => updateField("hero_subtitle_en", e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!settings.show_view_count}
            onChange={(e) => updateField("show_view_count", e.target.checked)}
          />
          조회수 표시
        </label>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </Card>

      {/* Categories */}
      <Card variant="filled" className="p-6 space-y-4">
        <h2 className="text-lg font-bold">카테고리 관리</h2>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm">{cat.name} ({cat.nameEn})</span>
              <button onClick={() => deleteCategory(cat.id).then(() => getCategories().then(setCategories))} className="text-xs text-red-500 hover:underline">
                삭제
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="카테고리 (한국어)" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
          <Input placeholder="Category (English)" value={newCatNameEn} onChange={(e) => setNewCatNameEn(e.target.value)} />
          <Button onClick={handleAddCategory}>추가</Button>
        </div>
      </Card>

      {/* Tags */}
      <Card variant="filled" className="p-6 space-y-4">
        <h2 className="text-lg font-bold">태그 관리</h2>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <span key={tag.id} className="inline-flex items-center gap-1 px-3 py-1 bg-bg-primary rounded-full text-sm border border-border">
              {tag.name} ({tag.nameEn})
              <button onClick={() => deleteTag(tag.id).then(() => getTags().then(setAllTags))} className="text-text-secondary hover:text-red-500">&times;</button>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add admin settings page with categories and tags management"
```

---

## Task 21: Blog Components (PostCard, PostGrid, HeroSection, FilterBar)

**Files:**
- Create: `src/components/blog/PostCard.tsx`, `src/components/blog/PostGrid.tsx`, `src/components/blog/HeroSection.tsx`, `src/components/blog/FilterBar.tsx`

- [ ] **Step 1: Create PostCard**

```tsx
// src/components/blog/PostCard.tsx
"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/i18n/provider";

interface PostCardProps {
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  categoryName: string;
  categoryNameEn: string;
}

export function PostCard({ title, titleEn, slug, thumbnail, createdAt, categoryName, categoryNameEn }: PostCardProps) {
  const { locale } = useI18n();
  const displayTitle = locale === "en" && titleEn ? titleEn : title;
  const displayCategory = locale === "en" ? categoryNameEn : categoryName;

  return (
    <Link href={`/post/${slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        {thumbnail ? (
          <div className="aspect-video overflow-hidden">
            <img src={thumbnail} alt={displayTitle} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-video bg-bg-card flex items-center justify-center px-6">
            <h3 className="text-lg font-bold text-center line-clamp-3">{displayTitle}</h3>
          </div>
        )}
        <div className="p-4">
          {thumbnail && <h3 className="font-bold line-clamp-2">{displayTitle}</h3>}
          <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
            <span className="px-2 py-0.5 bg-bg-card rounded-full">{displayCategory}</span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create PostGrid**

```tsx
// src/components/blog/PostGrid.tsx
import { PostCard } from "./PostCard";

interface Post {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  categoryName: string;
  categoryNameEn: string;
}

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} {...post} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create HeroSection**

```tsx
// src/components/blog/HeroSection.tsx
"use client";

import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface HeroSectionProps {
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
}

export function HeroSection({ title, titleEn, subtitle, subtitleEn }: HeroSectionProps) {
  const { locale, t } = useI18n();
  const displayTitle = locale === "en" ? titleEn : title;
  const displaySubtitle = locale === "en" ? subtitleEn : subtitle;

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-content mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">{displayTitle}</h1>
        <p className="mt-4 text-lg text-text-secondary max-w-lg">{displaySubtitle}</p>
        <div className="mt-8 flex gap-3">
          <Link href="/search">
            <Button>{t("hero.allPosts")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create FilterBar**

```tsx
// src/components/blog/FilterBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/provider";

interface Category {
  id: number;
  name: string;
  nameEn: string;
  slug: string;
}

interface Tag {
  id: number;
  name: string;
  nameEn: string;
}

interface FilterBarProps {
  categories: Category[];
  tags: Tag[];
}

export function FilterBar({ categories, tags }: FilterBarProps) {
  const pathname = usePathname();
  const { locale } = useI18n();

  return (
    <div className="space-y-4">
      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/"
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
            pathname === "/" ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:text-text-primary"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              pathname === `/category/${cat.slug}` ? "bg-accent text-white" : "bg-bg-card text-text-secondary hover:text-text-primary"
            }`}
          >
            {locale === "en" ? cat.nameEn : cat.name}
          </Link>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tag/${tag.nameEn.toLowerCase().replace(/\s+/g, "-")}`}
            className="px-3 py-1 rounded-full text-xs bg-bg-card text-text-secondary hover:text-text-primary transition-colors"
          >
            #{locale === "en" ? tag.nameEn : tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add blog components (PostCard, PostGrid, HeroSection, FilterBar)"
```

---

## Task 22: Main Page (Home)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement home page**

```tsx
// src/app/page.tsx
import { HeroSection } from "@/components/blog/HeroSection";
import { PostGrid } from "@/components/blog/PostGrid";
import { FilterBar } from "@/components/blog/FilterBar";
import { getPosts } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";
import { getSettings } from "@/actions/settings";
import { db } from "@/db";
import { categories as catTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const [allPosts, allCategories, allTags, settings] = await Promise.all([
    getPosts({ published: true }),
    getCategories(),
    getTags(),
    getSettings(),
  ]);

  // Join category info to posts
  const postsWithCategory = allPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
    };
  });

  return (
    <div>
      <HeroSection
        title={(settings.hero_title as string) || "Welcome"}
        titleEn={(settings.hero_title_en as string) || "Welcome"}
        subtitle={(settings.hero_subtitle as string) || ""}
        subtitleEn={(settings.hero_subtitle_en as string) || ""}
      />

      <section className="max-w-content mx-auto px-6 pb-20 space-y-8">
        <FilterBar categories={allCategories} tags={allTags} />
        <PostGrid posts={postsWithCategory} />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: implement home page with hero, filters, and post grid"
```

---

## Task 23: Post Detail Page + Markdown Rendering

**Files:**
- Create: `src/components/blog/MarkdownRenderer.tsx`, `src/components/blog/TableOfContents.tsx`, `src/app/post/[slug]/page.tsx`

- [ ] **Step 1: Create MarkdownRenderer**

```tsx
// src/components/blog/MarkdownRenderer.tsx
import ReactMarkdown from "react-markdown";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export async function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // rehype-pretty-code with Shiki for GitHub-style code blocks
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypePrettyCode, {
            theme: { dark: "github-dark", light: "github-light" },
            keepBackground: true,
          }],
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

Note: `rehype-pretty-code`와 `react-markdown`의 호환성 문제가 있을 수 있음. 실제 구현 시 `unified` pipeline으로 서버 사이드 렌더링하는 방식으로 전환할 수 있음.

- [ ] **Step 2: Create TableOfContents**

```tsx
// src/components/blog/TableOfContents.tsx
"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const { t } = useI18n();

  useEffect(() => {
    const elements = document.querySelectorAll(".prose h1, .prose h2, .prose h3");
    const items: TOCItem[] = Array.from(elements).map((el) => {
      const id = el.textContent?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9가-힣-]/g, "") || "";
      el.id = id;
      return {
        id,
        text: el.textContent || "",
        level: Number(el.tagName[1]),
      };
    });
    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block sticky top-24 w-60 ml-8 shrink-0">
      <p className="text-sm font-bold mb-3">{t("post.tableOfContents")}</p>
      <ul className="space-y-1.5 text-sm">
        {headings.map((heading) => (
          <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}>
            <a
              href={`#${heading.id}`}
              className={`block truncate transition-colors ${
                activeId === heading.id ? "text-accent font-medium" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 3: Create post detail page**

```tsx
// src/app/post/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostBySlug, getPostTags, incrementViewCount } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getSetting } from "@/actions/settings";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CommentSection } from "@/components/blog/CommentSection";
import { PostDetailClient } from "./client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.content.slice(0, 160),
      images: post.thumbnail ? [post.thumbnail] : [],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.isPublished) notFound();

  await incrementViewCount(slug);

  const [postTags, categories, showViewCount] = await Promise.all([
    getPostTags(post.id),
    getCategories(),
    getSetting("show_view_count"),
  ]);

  const category = categories.find((c) => c.id === post.categoryId);

  return (
    <PostDetailClient
      post={post}
      postTags={postTags}
      category={category || null}
      showViewCount={!!showViewCount}
    />
  );
}
```

```tsx
// src/app/post/[slug]/client.tsx
"use client";

import { useI18n } from "@/i18n/provider";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { CommentSection } from "@/components/blog/CommentSection";
import Link from "next/link";

interface PostDetailClientProps {
  post: {
    id: number;
    title: string;
    titleEn: string | null;
    slug: string;
    content: string;
    contentEn: string | null;
    createdAt: string;
    viewCount: number;
    categoryId: number;
  };
  postTags: { id: number; name: string; nameEn: string }[];
  category: { name: string; nameEn: string; slug: string } | null;
  showViewCount: boolean;
}

export function PostDetailClient({ post, postTags, category, showViewCount }: PostDetailClientProps) {
  const { locale, t } = useI18n();

  const title = locale === "en" && post.titleEn ? post.titleEn : post.title;
  const content = locale === "en" && post.contentEn ? post.contentEn : post.content;
  const catName = locale === "en" ? category?.nameEn : category?.name;

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      {/* Header */}
      <header className="max-w-prose mx-auto mb-10">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
        <div className="flex items-center gap-3 mt-4 text-sm text-text-secondary">
          {category && (
            <Link href={`/category/${category.slug}`} className="px-3 py-1 bg-bg-card rounded-full hover:text-text-primary">
              {catName}
            </Link>
          )}
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          {showViewCount && <span>{t("post.viewCount")} {post.viewCount}</span>}
        </div>
        {postTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {postTags.map((tag) => (
              <span key={tag.id} className="text-xs text-accent">
                #{locale === "en" ? tag.nameEn : tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Content + TOC */}
      <div className="flex justify-center">
        <article className="max-w-prose w-full">
          <MarkdownRenderer content={content} />
        </article>
        <TableOfContents />
      </div>

      {/* Comments */}
      <div className="max-w-prose mx-auto mt-16">
        <CommentSection postId={post.id} slug={post.slug} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add post detail page with markdown rendering and TOC"
```

---

## Task 24: Comment Section

**Files:**
- Create: `src/components/blog/CommentSection.tsx`, `src/components/blog/CommentItem.tsx`

- [ ] **Step 1: Create CommentItem**

```tsx
// src/components/blog/CommentItem.tsx
"use client";

import { useState } from "react";
import { deleteComment } from "@/actions/comments";
import { useI18n } from "@/i18n/provider";

interface CommentItemProps {
  comment: {
    id: number;
    nickname: string;
    content: string;
    createdAt: string;
    isDeleted: boolean;
    parentId: number | null;
  };
  slug: string;
  onReply: (commentId: number) => void;
  isReply?: boolean;
}

export function CommentItem({ comment, slug, onReply, isReply }: CommentItemProps) {
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [error, setError] = useState("");
  const { t } = useI18n();

  const handleDelete = async () => {
    const fd = new FormData();
    fd.set("commentId", String(comment.id));
    fd.set("password", deletePassword);
    fd.set("slug", slug);
    const result = await deleteComment(fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowDeleteForm(false);
    }
  };

  if (comment.isDeleted) {
    return (
      <div className={`py-4 ${isReply ? "ml-8" : ""}`}>
        <p className="text-sm text-text-secondary italic">{t("comment.deleted")}</p>
      </div>
    );
  }

  return (
    <div className={`py-4 ${isReply ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-sm">{comment.nickname}</span>
        <span className="text-xs text-text-secondary">{new Date(comment.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      <div className="flex gap-3 mt-2">
        {!isReply && (
          <button onClick={() => onReply(comment.id)} className="text-xs text-text-secondary hover:text-accent">
            {t("comment.reply")}
          </button>
        )}
        <button onClick={() => setShowDeleteForm(!showDeleteForm)} className="text-xs text-text-secondary hover:text-red-500">
          {t("comment.delete")}
        </button>
      </div>
      {showDeleteForm && (
        <div className="flex gap-2 mt-2">
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder={t("comment.confirmDelete")}
            className="px-3 py-1.5 text-sm border border-border rounded-lg bg-bg-primary"
          />
          <button onClick={handleDelete} className="px-3 py-1.5 text-sm text-red-500 border border-red-500 rounded-lg hover:bg-red-50">
            {t("comment.delete")}
          </button>
          {error && <span className="text-xs text-red-500 self-center">{error}</span>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create CommentSection**

```tsx
// src/components/blog/CommentSection.tsx
"use client";

import { useState, useEffect } from "react";
import { getComments, createComment } from "@/actions/comments";
import { CommentItem } from "./CommentItem";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/provider";

interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  nickname: string;
  password: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
}

interface CommentSectionProps {
  postId: number;
  slug: string;
}

export function CommentSection({ postId, slug }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  const loadComments = () => getComments(postId).then(setComments);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !password || !content) return;
    setSubmitting(true);

    const fd = new FormData();
    fd.set("postId", String(postId));
    fd.set("slug", slug);
    fd.set("nickname", nickname);
    fd.set("password", password);
    fd.set("content", content);
    if (replyTo) fd.set("parentId", String(replyTo));

    await createComment(fd);
    setContent("");
    setReplyTo(null);
    setSubmitting(false);
    loadComments();
  };

  // Group: top-level comments + their replies
  const topLevel = comments.filter((c) => !c.parentId);
  const replies = comments.filter((c) => c.parentId);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">{t("comment.title")} ({comments.length})</h3>

      {/* Comment list */}
      <div className="divide-y divide-border">
        {topLevel.map((comment) => (
          <div key={comment.id}>
            <CommentItem comment={comment} slug={slug} onReply={(id) => setReplyTo(id)} />
            {replies
              .filter((r) => r.parentId === comment.id)
              .map((reply) => (
                <CommentItem key={reply.id} comment={reply} slug={slug} onReply={(id) => setReplyTo(comment.id)} isReply />
              ))}
          </div>
        ))}
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        {replyTo && (
          <div className="flex items-center gap-2 text-sm text-accent">
            <span>답글 작성 중</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-text-secondary hover:text-text-primary">&times;</button>
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t("comment.nickname")}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("comment.password")}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm"
            required
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("comment.content")}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-border bg-bg-primary text-sm resize-none"
          required
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "..." : t("comment.submit")}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add comment section with replies and delete"
```

---

## Task 25: Category, Tag, Search Pages

**Files:**
- Create: `src/app/category/[slug]/page.tsx`, `src/app/tag/[slug]/page.tsx`, `src/app/search/page.tsx`

- [ ] **Step 1: Create category page**

```tsx
// src/app/category/[slug]/page.tsx
import { notFound } from "next/navigation";
import { PostGrid } from "@/components/blog/PostGrid";
import { FilterBar } from "@/components/blog/FilterBar";
import { getPosts } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [allCategories, allTags] = await Promise.all([getCategories(), getTags()]);
  const category = allCategories.find((c) => c.slug === slug);
  if (!category) notFound();

  const allPosts = await getPosts({ published: true, categoryId: category.id });
  const postsWithCategory = allPosts.map((post) => ({
    ...post,
    categoryName: category.name,
    categoryNameEn: category.nameEn,
  }));

  return (
    <div className="max-w-content mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      <FilterBar categories={allCategories} tags={allTags} />
      <PostGrid posts={postsWithCategory} />
    </div>
  );
}
```

- [ ] **Step 2: Create tag page**

```tsx
// src/app/tag/[slug]/page.tsx
import { notFound } from "next/navigation";
import { PostGrid } from "@/components/blog/PostGrid";
import { getCategories } from "@/actions/categories";
import { getTags } from "@/actions/tags";
import { db } from "@/db";
import { posts, postTags, tags, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const allTags = await getTags();
  const tag = allTags.find(
    (t) => t.nameEn.toLowerCase().replace(/\s+/g, "-") === slug
  );
  if (!tag) notFound();

  const taggedPosts = db
    .select({
      id: posts.id,
      title: posts.title,
      titleEn: posts.titleEn,
      slug: posts.slug,
      thumbnail: posts.thumbnail,
      createdAt: posts.createdAt,
      categoryId: posts.categoryId,
    })
    .from(postTags)
    .innerJoin(posts, eq(postTags.postId, posts.id))
    .where(and(eq(postTags.tagId, tag.id), eq(posts.isPublished, true)))
    .all();

  const allCategories = await getCategories();
  const postsWithCategory = taggedPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
    };
  });

  return (
    <div className="max-w-content mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold">#{tag.name}</h1>
      <PostGrid posts={postsWithCategory} />
    </div>
  );
}
```

- [ ] **Step 3: Create search page**

```tsx
// src/app/search/page.tsx
import { PostGrid } from "@/components/blog/PostGrid";
import { searchPosts } from "@/actions/search";
import { getCategories } from "@/actions/categories";
import { SearchBar } from "@/components/ui/SearchBar";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const allCategories = await getCategories();

  const results = q ? await searchPosts(q) : [];
  const postsWithCategory = results.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
    };
  });

  return (
    <div className="max-w-content mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold">검색</h1>
      <div className="max-w-md">
        <SearchBar />
      </div>
      {q && (
        <p className="text-sm text-text-secondary">
          &quot;{q}&quot; 검색 결과 {results.length}건
        </p>
      )}
      <PostGrid posts={postsWithCategory} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add category, tag, and search pages"
```

---

## Task 26: Tailwind Typography Plugin + Prose Styling

**Files:**
- Modify: `tailwind.config.ts`, `src/app/globals.css`

- [ ] **Step 1: Install typography plugin**

```bash
npm install @tailwindcss/typography
```

- [ ] **Step 2: Add plugin to tailwind config**

Add to `tailwind.config.ts` plugins array:

```typescript
plugins: [require("@tailwindcss/typography")],
```

- [ ] **Step 3: Add prose dark mode overrides to globals.css**

Append to `src/app/globals.css`:

```css
/* Code block styling - GitHub style */
pre[data-theme] {
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.7;
}

[data-theme="light"] pre[data-theme] {
  display: block;
}

.dark [data-theme="light"] pre[data-theme] {
  display: none;
}

[data-theme="dark"] pre[data-theme] {
  display: none;
}

.dark [data-theme="dark"] pre[data-theme] {
  display: block;
}

code[data-line-numbers] > [data-line]::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 1rem;
  margin-right: 1rem;
  text-align: right;
  color: gray;
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind typography and code block styling"
```

---

## Task 27: Docker Production Setup + GitHub Actions

**Files:**
- Create: `docker-compose.prod.yml`, `.github/workflows/deploy.yml`

- [ ] **Step 1: Create production docker-compose**

```yaml
# docker-compose.prod.yml
services:
  app:
    image: ghcr.io/${GITHUB_REPOSITORY}:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    env_file: .env.production
    restart: unless-stopped
```

- [ ] **Step 2: Create GitHub Actions workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          target: production
          push: true
          tags: ghcr.io/${{ github.repository }}:latest

      - name: Deploy to mini PC
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd ~/blog
            docker pull ghcr.io/${{ github.repository }}:latest
            docker compose -f docker-compose.prod.yml up -d
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Docker production setup and GitHub Actions deployment"
```

---

## Task 28: Final Wiring + Integration Test

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Fix any failures.

- [ ] **Step 2: Run dev server and manually test**

```bash
npm run dev
```

Verify:
- Home page loads with hero + empty post grid
- `/my/login` shows login form
- Login with env credentials → redirects to `/my`
- Create a post → verify it appears on home
- View post detail → markdown renders correctly
- Add a comment → verify it shows
- Toggle dark mode → verify colors change
- Toggle language → verify text switches
- Search works

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final wiring and integration fixes"
```
