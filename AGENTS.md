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

## Running / smoke-testing a build
- `next.config.ts` uses `output: "standalone"`. `next start` is a no-op here — run `node .next/standalone/server.js`.
- The standalone server's CWD is `.next/standalone/`, so the default `DATABASE_PATH=./data/blog.db` resolves to a fresh empty DB → `SqliteError: no such table`. When smoke-testing the build, pass an absolute path: `DATABASE_PATH="$(pwd)/data/blog.db" node .next/standalone/server.js`.
- The home route (`/[locale]`) transitively imports `@/lib/translate`, which constructs an OpenAI client at module load. Without `OPENAI_API_KEY` the home route 500s with "Missing credentials"; other routes are unaffected. Set the key when verifying the home page locally.

## SEO/OG
- `metadataBase` is set in the root `layout.tsx`; per-page `generateMetadata` adds hreflang (`alternates.languages`), canonical, and OG/Twitter via helpers in `src/lib/seo.ts`. Dynamic OG images: `[locale]/{post,projects}/[slug]/opengraph-image.tsx` (`next/og`, 1200×630). `sitemap.ts` and `robots.ts` are at `src/app/` (locale-agnostic) and emit both-locale URLs with alternates.
