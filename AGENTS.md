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
