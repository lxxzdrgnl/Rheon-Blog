<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions & hard-won gotchas

## i18n routing
- Public routes live under `src/app/[locale]/` (`ko` | `en`, from `src/i18n/config.ts`). `/my` (admin) and `/api` are NOT under `[locale]`.
- `locale` comes from the URL and is passed as a **prop** into `I18nProvider` (no `localStorage`, no `setLocale`). Use `useLocalized()` to pick ko/en values and `useI18n().t()` for UI strings. `generateMetadata`/`opengraph-image` run server-side — branch on `locale` with plain `locale === "en" ? en : ko`, never the client `t()`.
- Internal links in **public client components** use `LocaleLink` (`@/components/ui/LocaleLink`), which auto-prefixes `/{locale}`. Admin components and the root `not-found.tsx` keep plain `next/link`.
- Language switching is a **soft navigation** (`router.push(swapLocaleInPath(path, other), { scroll: false })`) + `NEXT_LOCALE` cookie — not an in-place state toggle. Pure helpers live in `src/lib/locale.ts` (`isLocale`, `matchLocale`, `localizeHref`, `swapLocaleInPath`) and are unit-tested in `tests/lib/locale.test.ts`.

## Proxy (Next 16 renamed Middleware → Proxy) — read this before touching routing
- There is exactly **one** proxy file: **`src/proxy.ts`** (named export `proxy`). It MUST sit at the same level as `app/` — i.e. inside `src/`, because this project uses `src/app`. A `proxy.ts` (or `middleware.ts`) at the **project root is silently ignored at runtime** in this version (the build still prints `ƒ Proxy (Middleware)`, but `middleware-manifest.json` is empty and no redirects fire). This cost real debugging time — do not move it to the root.
- Only one proxy/middleware file may exist. If both `middleware.ts` and `proxy.ts` are present they conflict and one silently wins. The single `src/proxy.ts` does BOTH jobs: (1) admin/API auth for `/my` + `/api` (JWT cookie verify/refresh), and (2) i18n locale redirect for public paths.
- Locale-less public URLs (`/`, `/posts`, `/post/...`) get a 307 to `/{locale}` chosen by: `NEXT_LOCALE` cookie → `Accept-Language` → default `ko`.

## Auth on server actions — the proxy is NOT enough
- The proxy only gates path prefixes (`/my`, `/api`). **Server Actions are public POST endpoints resolved from a global action manifest**, so they can be invoked on *any* route (incl. public `/{locale}` paths the proxy waves through) by anyone who has the action id — which is exposed in publicly-downloadable `_next` JS chunks. Relying on the proxy alone = unauthenticated attackers can call mutating actions.
- **Every mutating server action MUST call `await requireAdmin()` (from `@/lib/admin-context`) as its first statement.** Read-only getters used by public pages (`get*`, `incrementViewCount`, public `search*`) must NOT be guarded, and public commenter actions (`createComment`, password-checked `deleteComment`) keep their own checks. When adding a new action, default to guarding it unless it's deliberately public.
- `requireAdmin()` passes when either (a) a valid `access_token` cookie is present, or (b) it runs inside a `runAsAdmin()` async context. The MCP route (`/api/mcp`) verifies its Bearer `MCP_TOKEN` first, then wraps `dispatch()` in `runAsAdmin()` so it can reuse the same guarded actions without a cookie. `requireAdmin`/`runAsAdmin` live in `src/lib/admin-context.ts` (uses `node:async_hooks`) — kept separate from `src/lib/auth.ts` so the **edge-runtime proxy bundle never imports `async_hooks`**. Do not move `requireAdmin` back into `auth.ts`.

## SSRF — server-side fetch of user-supplied URLs
- Endpoints that fetch a user-provided URL (`/api/og`, `/api/favicon`) must use **`safeFetch` from `@/lib/ssrf`**, never raw `fetch`. It enforces http(s)-only, DNS-resolves the host and blocks private/loopback/link-local/reserved ranges (incl. `169.254.0.0/16` cloud-metadata), and re-validates every redirect hop. Any new route that fetches an attacker-controlled URL must do the same.

## Markdown rendering — keep it sanitized
- `src/components/blog/MarkdownRenderer.tsx` renders post/project/résumé bodies with `rehypeRaw` (raw HTML allowed). It MUST be followed by `rehypeSanitize` (`rehypePlugins={[rehypeRaw, rehypeSanitize]}`, in that order) — raw-parse then clean. The default GitHub schema strips `<script>`/`on*`/`javascript:` while preserving `language-*` code fences (mermaid + highlight), images (`alt`/`width`), and tables. **Never use `rehypeRaw` without `rehypeSanitize` after it.** (TOC heading ids are assigned client-side in `TableOfContents.tsx`, so sanitize's id-clobbering does not affect anchors.)

## Running / smoke-testing a build
- `next.config.ts` uses `output: "standalone"`. `next start` is a no-op here — run `node .next/standalone/server.js`.
- The standalone server's CWD is `.next/standalone/`, so the default `DATABASE_PATH=./data/blog.db` resolves to a fresh empty DB → `SqliteError: no such table`. When smoke-testing the build, pass an absolute path: `DATABASE_PATH="$(pwd)/data/blog.db" node .next/standalone/server.js`.
- The home route (`/[locale]`) transitively imports `@/lib/translate`, which constructs an OpenAI client at module load. Without `OPENAI_API_KEY` the home route 500s with "Missing credentials"; other routes are unaffected. Set the key when verifying the home page locally.

## SEO/OG
- `metadataBase` is set in the root `layout.tsx`; per-page `generateMetadata` adds hreflang (`alternates.languages`), canonical, and OG/Twitter via helpers in `src/lib/seo.ts`. Dynamic OG images: `[locale]/{post,projects}/[slug]/opengraph-image.tsx` (`next/og`, 1200×630). `sitemap.ts` and `robots.ts` are at `src/app/` (locale-agnostic) and emit both-locale URLs with alternates.
- **JSON-LD must go through the `JsonLd` component** (`@/components/seo/JsonLd`), never a hand-rolled `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(...)}} />`. The component uses `jsonLdSafe()` to escape `<`/`>`/`&` → `<`… so a value containing `</script>` can't break out of the script block.
- **RSS (`src/lib/markdown.ts` `markdownToHtml`)** output is passed through `sanitizeFeedHtml()` (strips `<script>`/`<iframe>`/`on*`/`javascript:`) and link/image URLs go through `safeUrl()` + `escAttr()`. Keep it that way for `content:encoded`.

## DB migrations — schema is the source of truth, never hand-edit the DB
- **Prod and dev both auto-migrate additively** — you do NOT run migrations by hand. Build runs `scripts/dump-schema.ts` → `schema-snapshot.json`; container startup runs `scripts/migrate-prod.cjs`, which ADDS any missing table/column from the snapshot and **never drops/alters/recreates** (data can't be lost). Dev does the exact same via the `predev` npm script (`dump-schema && migrate-prod`) before `next dev`. ⇒ add a column to `src/db/schema.ts`, restart, and it appears everywhere automatically.
- The `drizzle/*.sql` files from `db:generate` are **not applied anywhere** — `db:push` (Dockerfile build) targets a throwaway build DB, and prod/dev use the snapshot migrator. They're generate artifacts only; don't rely on them.
- **Never `ALTER`/`sqlite3` the live `data/blog.db` from the host while the dev container is up.** Two processes opening the same SQLite file corrupt the WAL + FTS5 shadow tables — you get `database disk image is malformed` / `SQLITE_CORRUPT_VTAB` on the next write (the `posts_au` trigger updates `posts_fts`); `PRAGMA integrity_check` may still say `ok`. Recovery: stop the app, `backup`-copy the DB, rebuild FTS (`INSERT INTO posts_fts(posts_fts) VALUES('rebuild')`). The right move is just: edit `schema.ts` → `docker compose restart app`.

## Local dev MinIO bucket must be public-read
- Uploaded images show as broken icons in dev unless the local MinIO `blog` bucket allows anonymous download (prod's already does). One-time fix:
  `docker run --rm --network my-own-blog_default --entrypoint sh minio/mc -c 'mc alias set L http://minio:9000 minioadmin minioadmin; mc anonymous set download L/blog'`
  Upload URLs use `MINIO_PUBLIC_ENDPOINT` (`localhost`) so the host browser can reach them; a broken image after upload = bucket policy, not the URL.

## Thumbnail / cover UI is shared — keep it unified
- `src/components/blog/PostThumbnail.tsx` renders BOTH the no-image fallback cover AND the image+title overlay through the **same** `CenteredTitle()`/`layoutTitle()` (auto-scaling centered SVG, `title.slice(0, textLength || 8)`, breaks on space **and** `·`). Don't duplicate the sizing/slice logic; the overlay only adds a gradient scrim + drop-shadow on top.
- The admin cover editor is `src/components/admin/ThumbnailPicker.tsx` (content-image grid + upload + "제목으로 표시" + 글자수 sliders + "썸네일 위에 제목 표시" overlay toggle). It's reused by the write-page publish modal, `PublishSettingsModal` (글 목록 빠른 편집), and `SeriesManager`. Add cover controls there, not per-parent — they used to diverge and that caused bugs.
- `thumbnail` / `thumbnailTextLength*` / `showTitleOnThumbnail` exist on **both** `posts` and `series`. The overlay only applies when a real image `thumbnail` is set; the 글자수 slider controls how many title chars show on the fallback cover AND the overlay.

## Type scale & shared style constants — don't hardcode repeated font/label classes
- **`src/lib/styles.ts`** is the single source for the type scale + repeated class strings. The header comment there defines the **4-step scale** (작은 보조 `text-[11px]` / 라벨·스니펫 `text-[13px]`·`text-xs` / 본문·카드제목 `text-sm`·`CARD_TITLE` / 큰 본문·nav `text-base`). NOTE this project's tokens are bigger than Tailwind defaults (`text-xs`≈13px, `text-sm`≈15px, `text-base`≈17.6px). New UI follows this; do NOT introduce stray `text-[10px]`/`text-[12px]`/`text-[14px]`.
- Exported consts (literal strings → Tailwind JIT still collects them): **`EYEBROW`** (`text-[13px] font-bold uppercase tracking-wide`, for 관련 프로젝트·시리즈·이전/다음·레포지토리/데모/링크·관련 포스트·홈 SectionLabel·최근 포스트 — color added at call site), **`CARD_TITLE`** (포스트·시리즈 카드 제목), **`CARD_SNIPPET`** (카드 스니펫).
- Change a role's size by editing the const **once** — do NOT re-hardcode the eyebrow/card-title/snippet class in a component. The one intentional exception is ProjectCard's weightier `text-base font-bold` title — keep it.
