# Resume-Style Main Page & Post Series Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the main page as a one-page resume layout (intro, about, experience, skills, projects, recent posts, contact) with all sections admin-editable, and add Velog-style post series with table-of-contents and prev/next navigation.

**Architecture:** New Drizzle tables (`experiences`, `skills`, `social_links`, `series`) + `posts` column additions (`seriesId`, `seriesOrder`). Server actions for CRUD. Main page rebuilt with new section components. Admin pages at `/my/resume` and `/my/series`. Series UI on post detail page.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM + SQLite, Tailwind CSS, TypeScript, next-intl i18n

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/db/schema.ts` | Add `experiences`, `skills`, `socialLinks`, `series` tables; modify `posts` |
| `drizzle/0005_*.sql` | Auto-generated migration |
| `src/actions/resume.ts` | CRUD actions for experiences, skills, social links |
| `src/actions/series.ts` | CRUD actions for series |
| `src/components/blog/ResumeHeroSection.tsx` | Hero with name, title, tagline, profile photo |
| `src/components/blog/AboutSection.tsx` | Markdown about me |
| `src/components/blog/ExperienceSection.tsx` | Experience timeline |
| `src/components/blog/SkillsSection.tsx` | Skills grouped by category |
| `src/components/blog/ContactSection.tsx` | Social links |
| `src/components/blog/RecentPostsSection.tsx` | Latest posts grid |
| `src/components/blog/SeriesTableOfContents.tsx` | Series TOC on post detail |
| `src/components/blog/SeriesNavigation.tsx` | Prev/next post nav |
| `src/app/my/resume/page.tsx` | Admin resume management page |
| `src/app/my/series/page.tsx` | Admin series management page |
| `src/app/series/[slug]/page.tsx` | Public series detail page |

### Modified Files
| File | Changes |
|------|---------|
| `src/app/page.tsx` | Replace with resume-style layout |
| `src/app/post/[slug]/page.tsx` | Fetch series data, pass to client |
| `src/app/post/[slug]/client.tsx` | Add SeriesTableOfContents + SeriesNavigation |
| `src/app/my/layout.tsx` | Add nav items for resume & series |
| `src/app/my/write/page.tsx` | Add series selection dropdown |
| `src/actions/posts.ts` | Add seriesId/seriesOrder to savePost |
| `src/i18n/messages/ko.json` | Add resume & series i18n keys |
| `src/i18n/messages/en.json` | Add resume & series i18n keys |

---

## Task 1: Database Schema & Migration

**Files:**
- Modify: `src/db/schema.ts`
- Create: migration via `npx drizzle-kit generate`

- [ ] **Step 1: Add new tables and modify posts in schema.ts**

Add after the existing `settings` table in `src/db/schema.ts`:

```typescript
export const experiences = sqliteTable("experiences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  companyEn: text("company_en"),
  role: text("role").notNull(),
  roleEn: text("role_en"),
  description: text("description"),
  descriptionEn: text("description_en"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  categoryEn: text("category_en"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const socialLinks = sqliteTable("social_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const series = sqliteTable("series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionEn: text("description_en"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
```

Add two columns to the existing `posts` table definition:

```typescript
seriesId: integer("series_id").references(() => series.id),
seriesOrder: integer("series_order"),
```

- [ ] **Step 2: Generate migration**

Run: `npx drizzle-kit generate`
Expected: New migration file created in `drizzle/` directory

- [ ] **Step 3: Apply migration**

Run: `npx drizzle-kit push`
Expected: Tables created, posts table altered

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add experiences, skills, social_links, series tables and posts series columns"
```

---

## Task 2: Resume Server Actions

**Files:**
- Create: `src/actions/resume.ts`

- [ ] **Step 1: Create resume.ts with all CRUD actions**

```typescript
"use server";

import { db } from "@/db";
import { experiences, skills, socialLinks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Experiences ──

export async function getExperiences() {
  return db.select().from(experiences).orderBy(asc(experiences.sortOrder)).all();
}

export async function createExperience(data: {
  company: string; companyEn?: string; role: string; roleEn?: string;
  description?: string; descriptionEn?: string; startDate: string; endDate?: string;
}) {
  const all = await getExperiences();
  db.insert(experiences).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateExperience(id: number, data: {
  company: string; companyEn?: string; role: string; roleEn?: string;
  description?: string; descriptionEn?: string; startDate: string; endDate?: string;
}) {
  db.update(experiences).set(data).where(eq(experiences.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteExperience(id: number) {
  db.delete(experiences).where(eq(experiences.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function reorderExperiences(orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(experiences).set({ sortOrder: i }).where(eq(experiences.id, orderedIds[i])).run();
  }
  revalidatePath("/");
  revalidatePath("/my/resume");
}

// ── Skills ──

export async function getSkills() {
  return db.select().from(skills).orderBy(asc(skills.sortOrder)).all();
}

export async function createSkill(data: { name: string; category: string; categoryEn?: string }) {
  const all = await getSkills();
  db.insert(skills).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateSkill(id: number, data: { name: string; category: string; categoryEn?: string }) {
  db.update(skills).set(data).where(eq(skills.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteSkill(id: number) {
  db.delete(skills).where(eq(skills.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

// ── Social Links ──

export async function getSocialLinks() {
  return db.select().from(socialLinks).orderBy(asc(socialLinks.sortOrder)).all();
}

export async function createSocialLink(data: { platform: string; url: string }) {
  const all = await getSocialLinks();
  db.insert(socialLinks).values({ ...data, sortOrder: all.length }).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function updateSocialLink(id: number, data: { platform: string; url: string }) {
  db.update(socialLinks).set(data).where(eq(socialLinks.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function deleteSocialLink(id: number) {
  db.delete(socialLinks).where(eq(socialLinks.id, id)).run();
  revalidatePath("/");
  revalidatePath("/my/resume");
}

export async function reorderSocialLinks(orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    db.update(socialLinks).set({ sortOrder: i }).where(eq(socialLinks.id, orderedIds[i])).run();
  }
  revalidatePath("/");
  revalidatePath("/my/resume");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/resume.ts
git commit -m "feat: add resume server actions for experiences, skills, social links"
```

---

## Task 3: Series Server Actions

**Files:**
- Create: `src/actions/series.ts`
- Modify: `src/actions/posts.ts`

- [ ] **Step 1: Create series.ts**

```typescript
"use server";

import { db } from "@/db";
import { series, posts } from "@/db/schema";
import { eq, asc, and, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/slug";

export async function getAllSeries() {
  return db.select().from(series).orderBy(asc(series.createdAt)).all();
}

export async function getSeriesBySlug(slug: string) {
  return db.select().from(series).where(eq(series.slug, slug)).get();
}

export async function getSeriesById(id: number) {
  return db.select().from(series).where(eq(series.id, id)).get();
}

export async function getSeriesPosts(seriesId: number) {
  const result = db
    .select()
    .from(posts)
    .where(and(eq(posts.seriesId, seriesId), eq(posts.isPublished, true), eq(posts.isPrivate, false)))
    .all();

  return result.sort((a, b) => {
    if (a.seriesOrder != null && b.seriesOrder != null) return a.seriesOrder - b.seriesOrder;
    if (a.seriesOrder != null) return -1;
    if (b.seriesOrder != null) return 1;
    return (a.publishedAt || a.createdAt).localeCompare(b.publishedAt || b.createdAt);
  });
}

export async function createSeries(data: {
  title: string; titleEn?: string; description?: string; descriptionEn?: string;
}) {
  const slug = generateSlug(data.titleEn || data.title);
  const result = db.insert(series).values({ ...data, slug }).returning().get();
  revalidatePath("/my/series");
  return result;
}

export async function updateSeries(id: number, data: {
  title: string; titleEn?: string; description?: string; descriptionEn?: string;
}) {
  db.update(series).set(data).where(eq(series.id, id)).run();
  revalidatePath("/my/series");
  revalidatePath("/");
}

export async function deleteSeries(id: number) {
  // Remove series association from posts (don't delete posts)
  db.update(posts).set({ seriesId: null, seriesOrder: null }).where(eq(posts.seriesId, id)).run();
  db.delete(series).where(eq(series.id, id)).run();
  revalidatePath("/my/series");
  revalidatePath("/");
}

export async function reorderSeriesPosts(seriesId: number, orderedPostIds: number[]) {
  for (let i = 0; i < orderedPostIds.length; i++) {
    db.update(posts)
      .set({ seriesOrder: i })
      .where(and(eq(posts.id, orderedPostIds[i]), eq(posts.seriesId, seriesId)))
      .run();
  }
  revalidatePath("/");
}

export async function getSeriesWithPostCount() {
  const allSeries = await getAllSeries();
  return Promise.all(
    allSeries.map(async (s) => {
      const postCount = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(posts)
        .where(eq(posts.seriesId, s.id))
        .get();
      return { ...s, postCount: postCount?.count || 0 };
    })
  );
}
```

- [ ] **Step 2: Modify savePost in posts.ts to handle seriesId and seriesOrder**

In `src/actions/posts.ts`, in the `savePost` function, add after the `const tagIds = ...` line:

```typescript
const seriesId = formData.get("seriesId") ? Number(formData.get("seriesId")) : null;
const seriesOrder = formData.get("seriesOrder") ? Number(formData.get("seriesOrder")) : null;
```

Add `seriesId, seriesOrder` to both the `db.update(posts).set({...})` and `db.insert(posts).values({...})` calls.

For the update call, add to the set object:
```typescript
seriesId,
seriesOrder,
```

For the insert call, add to the values object:
```typescript
seriesId,
seriesOrder,
```

- [ ] **Step 3: Commit**

```bash
git add src/actions/series.ts src/actions/posts.ts
git commit -m "feat: add series server actions and update savePost for series support"
```

---

## Task 4: i18n Messages

**Files:**
- Modify: `src/i18n/messages/ko.json`
- Modify: `src/i18n/messages/en.json`

- [ ] **Step 1: Add Korean messages**

Add these keys to `src/i18n/messages/ko.json`:

```json
"resume": {
  "about": "소개",
  "experience": "경력",
  "skills": "기술 스택",
  "projects": "프로젝트",
  "recentPosts": "최근 포스트",
  "contact": "연락처",
  "present": "현재"
},
"series": {
  "title": "시리즈",
  "tableOfContents": "목차",
  "prev": "이전 글",
  "next": "다음 글",
  "postsCount": "개의 포스트"
}
```

- [ ] **Step 2: Add English messages**

Add these keys to `src/i18n/messages/en.json`:

```json
"resume": {
  "about": "About",
  "experience": "Experience",
  "skills": "Skills",
  "projects": "Projects",
  "recentPosts": "Recent Posts",
  "contact": "Contact",
  "present": "Present"
},
"series": {
  "title": "Series",
  "tableOfContents": "Table of Contents",
  "prev": "Previous",
  "next": "Next",
  "postsCount": "posts"
}
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/messages/ko.json src/i18n/messages/en.json
git commit -m "feat: add i18n messages for resume and series"
```

---

## Task 5: Resume Main Page Components

**Files:**
- Create: `src/components/blog/ResumeHeroSection.tsx`
- Create: `src/components/blog/AboutSection.tsx`
- Create: `src/components/blog/ExperienceSection.tsx`
- Create: `src/components/blog/SkillsSection.tsx`
- Create: `src/components/blog/RecentPostsSection.tsx`
- Create: `src/components/blog/ContactSection.tsx`

- [ ] **Step 1: Create ResumeHeroSection.tsx**

```tsx
"use client";

import { useLocalized } from "@/i18n/provider";

interface ResumeHeroSectionProps {
  name: string;
  nameEn: string;
  title: string;
  titleEn: string;
  tagline: string;
  taglineEn: string;
  profileImage: string | null;
}

export function ResumeHeroSection({ name, nameEn, title, titleEn, tagline, taglineEn, profileImage }: ResumeHeroSectionProps) {
  const localized = useLocalized();

  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-20">
      <div className="page-container">
        <div className="flex flex-col md:flex-row md:items-center md:gap-16">
          <div className="md:flex-1">
            <p className="text-sm text-accent font-medium tracking-wide uppercase mb-3">
              {localized(title, titleEn)}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight">
              {localized(name, nameEn)}
            </h1>
            <p className="mt-5 text-lg md:text-xl text-text-secondary max-w-lg leading-relaxed">
              {localized(tagline, taglineEn)}
            </p>
          </div>
          {profileImage && (
            <div className="mt-10 md:mt-0 shrink-0">
              <img
                src={profileImage}
                alt={localized(name, nameEn)}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-2 ring-border"
              />
            </div>
          )}
        </div>
        <div className="mt-10 h-px bg-gradient-to-r from-accent/40 via-border to-transparent" />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create AboutSection.tsx**

```tsx
"use client";

import { useI18n, useLocalized } from "@/i18n/provider";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";

interface AboutSectionProps {
  content: string;
  contentEn: string;
}

export function AboutSection({ content, contentEn }: AboutSectionProps) {
  const { t } = useI18n();
  const localized = useLocalized();
  const displayContent = localized(content, contentEn);

  if (!displayContent) return null;

  return (
    <section className="page-container pb-20">
      <h2 className="text-xl font-bold tracking-tight mb-8">
        <span className="text-accent mr-1.5">/</span>{t("resume.about")}
      </h2>
      <div className="max-w-prose text-text-secondary leading-relaxed">
        <MarkdownRenderer content={displayContent} />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create ExperienceSection.tsx**

```tsx
"use client";

import { useI18n, useLocalized } from "@/i18n/provider";

interface Experience {
  id: number;
  company: string;
  companyEn: string | null;
  role: string;
  roleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  startDate: string;
  endDate: string | null;
}

export function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  const { t } = useI18n();
  const localized = useLocalized();

  if (experiences.length === 0) return null;

  return (
    <section className="page-container pb-20">
      <h2 className="text-xl font-bold tracking-tight mb-8">
        <span className="text-accent mr-1.5">/</span>{t("resume.experience")}
      </h2>
      <div className="space-y-8">
        {experiences.map((exp) => (
          <div key={exp.id} className="relative pl-6 border-l-2 border-border hover:border-accent transition-colors">
            <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-accent" />
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
              <h3 className="font-semibold text-text-primary">
                {localized(exp.role, exp.roleEn)}
              </h3>
              <span className="text-sm text-text-secondary">
                {localized(exp.company, exp.companyEn)}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              {exp.startDate} — {exp.endDate || t("resume.present")}
            </p>
            {exp.description && (
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                {localized(exp.description, exp.descriptionEn)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create SkillsSection.tsx**

```tsx
"use client";

import { useI18n, useLocalized } from "@/i18n/provider";

interface Skill {
  id: number;
  name: string;
  category: string;
  categoryEn: string | null;
}

export function SkillsSection({ skills }: { skills: Skill[] }) {
  const { t } = useI18n();
  const localized = useLocalized();

  if (skills.length === 0) return null;

  // Group by category
  const grouped: Record<string, Skill[]> = {};
  for (const skill of skills) {
    const cat = localized(skill.category, skill.categoryEn);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(skill);
  }

  return (
    <section className="page-container pb-20">
      <h2 className="text-xl font-bold tracking-tight mb-8">
        <span className="text-accent mr-1.5">/</span>{t("resume.skills")}
      </h2>
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-text-secondary mb-3">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((skill) => (
                <span
                  key={skill.id}
                  className="px-3 py-1.5 text-sm bg-bg-elevated rounded-lg text-text-primary border border-border/60"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create RecentPostsSection.tsx**

```tsx
"use client";

import { useI18n } from "@/i18n/provider";
import { PostCard } from "./PostCard";
import Link from "next/link";

interface Post {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  categoryName: string;
  categoryNameEn: string;
  tags?: { name: string; nameEn: string }[];
}

export function RecentPostsSection({ posts }: { posts: Post[] }) {
  const { t } = useI18n();

  if (posts.length === 0) return null;

  return (
    <section className="page-container pb-20">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tight">
          <span className="text-accent mr-1.5">/</span>{t("resume.recentPosts")}
        </h2>
        <Link href="/posts" className="text-sm text-text-tertiary hover:text-accent transition-colors">
          {t("hero.allPosts")} →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, 6).map((post) => (
          <PostCard key={post.id} {...post} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create ContactSection.tsx**

```tsx
"use client";

import { useI18n } from "@/i18n/provider";

interface SocialLink {
  id: number;
  platform: string;
  url: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  github: "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12.01 12.01 0 0024 12c0-6.63-5.37-12-12-12z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  email: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
};

export function ContactSection({ links }: { links: SocialLink[] }) {
  const { t } = useI18n();

  if (links.length === 0) return null;

  return (
    <section className="page-container pb-24">
      <h2 className="text-xl font-bold tracking-tight mb-8">
        <span className="text-accent mr-1.5">/</span>{t("resume.contact")}
      </h2>
      <div className="flex flex-wrap gap-4">
        {links.map((link) => {
          const iconPath = PLATFORM_ICONS[link.platform.toLowerCase()];
          const href = link.platform.toLowerCase() === "email" ? `mailto:${link.url}` : link.url;
          return (
            <a
              key={link.id}
              href={href}
              target={link.platform.toLowerCase() === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border/60 hover:border-accent/30 hover:bg-bg-elevated transition-all text-sm text-text-secondary hover:text-text-primary"
            >
              {iconPath && (
                <svg className="w-4 h-4" viewBox={link.platform.toLowerCase() === "email" ? "0 0 24 24" : "0 0 24 24"} fill="currentColor">
                  <path d={iconPath} />
                </svg>
              )}
              {link.platform}
            </a>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/blog/ResumeHeroSection.tsx src/components/blog/AboutSection.tsx src/components/blog/ExperienceSection.tsx src/components/blog/SkillsSection.tsx src/components/blog/RecentPostsSection.tsx src/components/blog/ContactSection.tsx
git commit -m "feat: add resume section components for main page"
```

---

## Task 6: Rebuild Main Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx with resume layout**

```tsx
import { ResumeHeroSection } from "@/components/blog/ResumeHeroSection";
import { AboutSection } from "@/components/blog/AboutSection";
import { ExperienceSection } from "@/components/blog/ExperienceSection";
import { SkillsSection } from "@/components/blog/SkillsSection";
import { PortfolioSection } from "@/components/blog/PortfolioSection";
import { RecentPostsSection } from "@/components/blog/RecentPostsSection";
import { ContactSection } from "@/components/blog/ContactSection";
import { getPosts, getAllPostTags } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getSettings } from "@/actions/settings";
import { getPortfolios } from "@/actions/portfolios";
import { getExperiences, getSkills, getSocialLinks } from "@/actions/resume";

export default async function Home() {
  const [settings, allPosts, allCategories, allPortfolios, postTagsMap, experiences, skillsList, socialLinks] = await Promise.all([
    getSettings(),
    getPosts({ published: true, limit: 6 }),
    getCategories(),
    getPortfolios(),
    getAllPostTags(),
    getExperiences(),
    getSkills(),
    getSocialLinks(),
  ]);

  const postsWithCategory = allPosts.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags: postTagsMap[post.id] || [],
    };
  });

  return (
    <div>
      <ResumeHeroSection
        name={(settings.resume_name as string) || ""}
        nameEn={(settings.resume_name_en as string) || ""}
        title={(settings.resume_title as string) || ""}
        titleEn={(settings.resume_title_en as string) || ""}
        tagline={(settings.resume_tagline as string) || ""}
        taglineEn={(settings.resume_tagline_en as string) || ""}
        profileImage={(settings.resume_profile_image as string) || null}
      />
      <AboutSection
        content={(settings.resume_about as string) || ""}
        contentEn={(settings.resume_about_en as string) || ""}
      />
      <ExperienceSection experiences={experiences} />
      <SkillsSection skills={skillsList} />
      <PortfolioSection portfolios={allPortfolios} />
      <RecentPostsSection posts={postsWithCategory} />
      <ContactSection links={socialLinks} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rebuild main page with resume-style layout"
```

---

## Task 7: Series Components for Post Detail

**Files:**
- Create: `src/components/blog/SeriesTableOfContents.tsx`
- Create: `src/components/blog/SeriesNavigation.tsx`

- [ ] **Step 1: Create SeriesTableOfContents.tsx**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n, useLocalized } from "@/i18n/provider";

interface SeriesPost {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
}

interface SeriesTableOfContentsProps {
  seriesTitle: string;
  seriesTitleEn: string | null;
  posts: SeriesPost[];
  currentPostId: number;
}

export function SeriesTableOfContents({ seriesTitle, seriesTitleEn, posts, currentPostId }: SeriesTableOfContentsProps) {
  const { t } = useI18n();
  const localized = useLocalized();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-10 rounded-xl border border-border/60 bg-bg-elevated/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg-elevated transition-colors"
      >
        <div>
          <span className="text-xs text-accent font-medium uppercase tracking-wider">{t("series.title")}</span>
          <h3 className="font-semibold text-text-primary mt-0.5">{localized(seriesTitle, seriesTitleEn)}</h3>
        </div>
        <svg
          className={`w-4 h-4 text-text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <ol className="px-5 pb-4 space-y-1">
          {posts.map((post, idx) => {
            const isCurrent = post.id === currentPostId;
            return (
              <li key={post.id}>
                {isCurrent ? (
                  <span className="flex items-baseline gap-2.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-sm font-medium">
                    <span className="text-xs text-accent/60">{idx + 1}.</span>
                    {localized(post.title, post.titleEn)}
                  </span>
                ) : (
                  <Link
                    href={`/post/${post.slug}`}
                    className="flex items-baseline gap-2.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                  >
                    <span className="text-xs text-text-tertiary">{idx + 1}.</span>
                    {localized(post.title, post.titleEn)}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create SeriesNavigation.tsx**

```tsx
"use client";

import Link from "next/link";
import { useI18n, useLocalized } from "@/i18n/provider";

interface SeriesPost {
  id: number;
  title: string;
  titleEn: string | null;
  slug: string;
}

interface SeriesNavigationProps {
  prevPost: SeriesPost | null;
  nextPost: SeriesPost | null;
}

export function SeriesNavigation({ prevPost, nextPost }: SeriesNavigationProps) {
  const { t } = useI18n();
  const localized = useLocalized();

  if (!prevPost && !nextPost) return null;

  return (
    <nav className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-4">
      {prevPost ? (
        <Link
          href={`/post/${prevPost.slug}`}
          className="flex-1 group p-4 rounded-xl border border-border/60 hover:border-accent/30 transition-colors"
        >
          <span className="text-xs text-text-tertiary">{t("series.prev")}</span>
          <p className="text-sm font-medium text-text-primary mt-1 group-hover:text-accent transition-colors">
            ← {localized(prevPost.title, prevPost.titleEn)}
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {nextPost ? (
        <Link
          href={`/post/${nextPost.slug}`}
          className="flex-1 group p-4 rounded-xl border border-border/60 hover:border-accent/30 transition-colors text-right"
        >
          <span className="text-xs text-text-tertiary">{t("series.next")}</span>
          <p className="text-sm font-medium text-text-primary mt-1 group-hover:text-accent transition-colors">
            {localized(nextPost.title, nextPost.titleEn)} →
          </p>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/SeriesTableOfContents.tsx src/components/blog/SeriesNavigation.tsx
git commit -m "feat: add series TOC and navigation components"
```

---

## Task 8: Integrate Series into Post Detail Page

**Files:**
- Modify: `src/app/post/[slug]/page.tsx`
- Modify: `src/app/post/[slug]/client.tsx`

- [ ] **Step 1: Update page.tsx to fetch series data**

Replace the content of `src/app/post/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostBySlug, getPostTags } from "@/actions/posts";
import { getCategories } from "@/actions/categories";
import { getSetting } from "@/actions/settings";
import { getSeriesById, getSeriesPosts } from "@/actions/series";
import { PostDetailClient } from "./client";

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.content.slice(0, 160),
    openGraph: { title: post.title, description: post.content.slice(0, 160), images: post.thumbnail ? [post.thumbnail] : [] },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.isPublished || post.isPrivate) notFound();

  const [postTags, categories, showViewCount] = await Promise.all([
    getPostTags(post.id),
    getCategories(),
    getSetting("show_view_count"),
  ]);

  const category = categories.find((c) => c.id === post.categoryId);

  // Fetch series data if post belongs to a series
  let seriesData = null;
  if (post.seriesId) {
    const [seriesInfo, seriesPosts] = await Promise.all([
      getSeriesById(post.seriesId),
      getSeriesPosts(post.seriesId),
    ]);
    if (seriesInfo) {
      const currentIndex = seriesPosts.findIndex((p) => p.id === post.id);
      seriesData = {
        title: seriesInfo.title,
        titleEn: seriesInfo.titleEn,
        posts: seriesPosts.map((p) => ({ id: p.id, title: p.title, titleEn: p.titleEn, slug: p.slug })),
        prevPost: currentIndex > 0 ? seriesPosts[currentIndex - 1] : null,
        nextPost: currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null,
      };
    }
  }

  return (
    <PostDetailClient
      post={post}
      postTags={postTags}
      category={category || null}
      showViewCount={!!showViewCount}
      seriesData={seriesData}
    />
  );
}
```

- [ ] **Step 2: Update client.tsx to render series components**

In `src/app/post/[slug]/client.tsx`:

Add imports at the top:
```tsx
import { SeriesTableOfContents } from "@/components/blog/SeriesTableOfContents";
import { SeriesNavigation } from "@/components/blog/SeriesNavigation";
```

Add to the `PostDetailClientProps` interface:
```tsx
seriesData: {
  title: string;
  titleEn: string | null;
  posts: { id: number; title: string; titleEn: string | null; slug: string }[];
  prevPost: { id: number; title: string; titleEn: string | null; slug: string } | null;
  nextPost: { id: number; title: string; titleEn: string | null; slug: string } | null;
} | null;
```

Add `seriesData` to the destructured props in the function signature.

In the JSX, add `SeriesTableOfContents` right after the `<header>` closing tag (before the markdown content):
```tsx
{seriesData && (
  <SeriesTableOfContents
    seriesTitle={seriesData.title}
    seriesTitleEn={seriesData.titleEn}
    posts={seriesData.posts}
    currentPostId={post.id}
  />
)}
```

Add `SeriesNavigation` after the tags section / before the `CommentSection`:
```tsx
{seriesData && (
  <SeriesNavigation
    prevPost={seriesData.prevPost}
    nextPost={seriesData.nextPost}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/post/\[slug\]/page.tsx src/app/post/\[slug\]/client.tsx
git commit -m "feat: integrate series TOC and navigation into post detail page"
```

---

## Task 9: Admin Resume Page

**Files:**
- Create: `src/app/my/resume/page.tsx`

- [ ] **Step 1: Create the admin resume management page**

```tsx
"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/actions/settings";
import {
  getExperiences, createExperience, updateExperience, deleteExperience, reorderExperiences,
  getSkills, createSkill, updateSkill, deleteSkill,
  getSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink, reorderSocialLinks,
} from "@/actions/resume";
import { uploadImage } from "@/lib/upload";

type Experience = { id: number; company: string; companyEn: string | null; role: string; roleEn: string | null; description: string | null; descriptionEn: string | null; startDate: string; endDate: string | null; sortOrder: number };
type Skill = { id: number; name: string; category: string; categoryEn: string | null; sortOrder: number };
type SocialLink = { id: number; platform: string; url: string; sortOrder: number };

export default function ResumePage() {
  const [tab, setTab] = useState<"intro" | "experience" | "skills" | "links">("intro");

  // ── Intro state ──
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [tagline, setTagline] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [about, setAbout] = useState("");
  const [aboutEn, setAboutEn] = useState("");
  const [savingIntro, setSavingIntro] = useState(false);

  // ── Experience state ──
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingExp, setEditingExp] = useState<Partial<Experience> | null>(null);

  // ── Skills state ──
  const [skills, setSkills] = useState<Skill[]>([]);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);

  // ── Social Links state ──
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [editingLink, setEditingLink] = useState<Partial<SocialLink> | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      setName((s.resume_name as string) || "");
      setNameEn((s.resume_name_en as string) || "");
      setTitle((s.resume_title as string) || "");
      setTitleEn((s.resume_title_en as string) || "");
      setTagline((s.resume_tagline as string) || "");
      setTaglineEn((s.resume_tagline_en as string) || "");
      setProfileImage((s.resume_profile_image as string) || "");
      setAbout((s.resume_about as string) || "");
      setAboutEn((s.resume_about_en as string) || "");
    });
    getExperiences().then(setExperiences);
    getSkills().then(setSkills);
    getSocialLinks().then(setLinks);
  }, []);

  const handleSaveIntro = async () => {
    setSavingIntro(true);
    await updateSettings({
      resume_name: name, resume_name_en: nameEn,
      resume_title: title, resume_title_en: titleEn,
      resume_tagline: tagline, resume_tagline_en: taglineEn,
      resume_profile_image: profileImage,
      resume_about: about, resume_about_en: aboutEn,
    });
    setSavingIntro(false);
  };

  const handleSaveExperience = async () => {
    if (!editingExp?.company || !editingExp?.role || !editingExp?.startDate) return;
    if (editingExp.id) {
      await updateExperience(editingExp.id, {
        company: editingExp.company, companyEn: editingExp.companyEn || undefined,
        role: editingExp.role, roleEn: editingExp.roleEn || undefined,
        description: editingExp.description || undefined, descriptionEn: editingExp.descriptionEn || undefined,
        startDate: editingExp.startDate, endDate: editingExp.endDate || undefined,
      });
    } else {
      await createExperience({
        company: editingExp.company, companyEn: editingExp.companyEn || undefined,
        role: editingExp.role, roleEn: editingExp.roleEn || undefined,
        description: editingExp.description || undefined, descriptionEn: editingExp.descriptionEn || undefined,
        startDate: editingExp.startDate, endDate: editingExp.endDate || undefined,
      });
    }
    setEditingExp(null);
    setExperiences(await getExperiences());
  };

  const handleDeleteExperience = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteExperience(id);
    setExperiences(await getExperiences());
  };

  const handleMoveExperience = async (idx: number, dir: -1 | 1) => {
    const ids = experiences.map((e) => e.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await reorderExperiences(ids);
    setExperiences(await getExperiences());
  };

  const handleSaveSkill = async () => {
    if (!editingSkill?.name || !editingSkill?.category) return;
    if (editingSkill.id) {
      await updateSkill(editingSkill.id, { name: editingSkill.name, category: editingSkill.category, categoryEn: editingSkill.categoryEn || undefined });
    } else {
      await createSkill({ name: editingSkill.name, category: editingSkill.category, categoryEn: editingSkill.categoryEn || undefined });
    }
    setEditingSkill(null);
    setSkills(await getSkills());
  };

  const handleDeleteSkill = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteSkill(id);
    setSkills(await getSkills());
  };

  const handleSaveLink = async () => {
    if (!editingLink?.platform || !editingLink?.url) return;
    if (editingLink.id) {
      await updateSocialLink(editingLink.id, { platform: editingLink.platform, url: editingLink.url });
    } else {
      await createSocialLink({ platform: editingLink.platform, url: editingLink.url });
    }
    setEditingLink(null);
    setLinks(await getSocialLinks());
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await deleteSocialLink(id);
    setLinks(await getSocialLinks());
  };

  const handleMoveLink = async (idx: number, dir: -1 | 1) => {
    const ids = links.map((l) => l.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await reorderSocialLinks(ids);
    setLinks(await getSocialLinks());
  };

  const TABS = [
    { key: "intro" as const, label: "소개" },
    { key: "experience" as const, label: "경력" },
    { key: "skills" as const, label: "기술 스택" },
    { key: "links" as const, label: "소셜 링크" },
  ];

  const inputClass = "w-full px-3 py-2 text-sm bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary";
  const labelClass = "block text-xs text-text-tertiary uppercase tracking-wider font-medium mb-1.5";
  const btnPrimary = "px-4 py-2 bg-accent text-bg-primary text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50";
  const btnSecondary = "px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-elevated transition-colors";

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">이력서 관리</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? "border-accent text-text-primary" : "border-transparent text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Intro Tab ── */}
      {tab === "intro" && (
        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>이름</label><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className={labelClass}>Name (EN)</label><input className={inputClass} value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>직함</label><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><label className={labelClass}>Title (EN)</label><input className={inputClass} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClass}>한 줄 소개</label><input className={inputClass} value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
            <div><label className={labelClass}>Tagline (EN)</label><input className={inputClass} value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)} /></div>
          </div>
          <div>
            <label className={labelClass}>프로필 이미지</label>
            <div className="flex items-center gap-4">
              {profileImage && <img src={profileImage} alt="" className="w-16 h-16 rounded-full object-cover" />}
              <label className={btnSecondary + " cursor-pointer"}>
                업로드
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  if (url) setProfileImage(url);
                }} />
              </label>
              {profileImage && <button onClick={() => setProfileImage("")} className="text-xs text-red-500">제거</button>}
            </div>
          </div>
          <div><label className={labelClass}>자기소개 (마크다운)</label><textarea className={inputClass + " h-40"} value={about} onChange={(e) => setAbout(e.target.value)} /></div>
          <div><label className={labelClass}>About (EN, Markdown)</label><textarea className={inputClass + " h-40"} value={aboutEn} onChange={(e) => setAboutEn(e.target.value)} /></div>
          <button onClick={handleSaveIntro} disabled={savingIntro} className={btnPrimary}>{savingIntro ? "저장 중..." : "저장"}</button>
        </div>
      )}

      {/* ── Experience Tab ── */}
      {tab === "experience" && (
        <div className="space-y-4">
          <button onClick={() => setEditingExp({})} className={btnPrimary}>+ 경력 추가</button>

          {editingExp && (
            <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>회사</label><input className={inputClass} value={editingExp.company || ""} onChange={(e) => setEditingExp({ ...editingExp, company: e.target.value })} /></div>
                <div><label className={labelClass}>Company (EN)</label><input className={inputClass} value={editingExp.companyEn || ""} onChange={(e) => setEditingExp({ ...editingExp, companyEn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>직책</label><input className={inputClass} value={editingExp.role || ""} onChange={(e) => setEditingExp({ ...editingExp, role: e.target.value })} /></div>
                <div><label className={labelClass}>Role (EN)</label><input className={inputClass} value={editingExp.roleEn || ""} onChange={(e) => setEditingExp({ ...editingExp, roleEn: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>시작일 (YYYY-MM)</label><input className={inputClass} value={editingExp.startDate || ""} onChange={(e) => setEditingExp({ ...editingExp, startDate: e.target.value })} placeholder="2024-01" /></div>
                <div><label className={labelClass}>종료일 (비우면 현재)</label><input className={inputClass} value={editingExp.endDate || ""} onChange={(e) => setEditingExp({ ...editingExp, endDate: e.target.value })} placeholder="2025-03" /></div>
              </div>
              <div><label className={labelClass}>설명</label><textarea className={inputClass + " h-20"} value={editingExp.description || ""} onChange={(e) => setEditingExp({ ...editingExp, description: e.target.value })} /></div>
              <div><label className={labelClass}>Description (EN)</label><textarea className={inputClass + " h-20"} value={editingExp.descriptionEn || ""} onChange={(e) => setEditingExp({ ...editingExp, descriptionEn: e.target.value })} /></div>
              <div className="flex gap-2">
                <button onClick={handleSaveExperience} className={btnPrimary}>저장</button>
                <button onClick={() => setEditingExp(null)} className={btnSecondary}>취소</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {experiences.map((exp, idx) => (
              <div key={exp.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMoveExperience(idx, -1)} disabled={idx === 0} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▲</button>
                  <button onClick={() => handleMoveExperience(idx, 1)} disabled={idx === experiences.length - 1} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{exp.role} @ {exp.company}</p>
                  <p className="text-xs text-text-tertiary">{exp.startDate} — {exp.endDate || "현재"}</p>
                </div>
                <button onClick={() => setEditingExp(exp)} className={btnSecondary}>수정</button>
                <button onClick={() => handleDeleteExperience(exp.id)} className="text-xs text-red-500 hover:text-red-400">삭제</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Skills Tab ── */}
      {tab === "skills" && (
        <div className="space-y-4">
          <button onClick={() => setEditingSkill({})} className={btnPrimary}>+ 기술 추가</button>

          {editingSkill && (
            <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
              <div><label className={labelClass}>기술명</label><input className={inputClass} value={editingSkill.name || ""} onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })} placeholder="React" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>카테고리</label><input className={inputClass} value={editingSkill.category || ""} onChange={(e) => setEditingSkill({ ...editingSkill, category: e.target.value })} placeholder="프론트엔드" /></div>
                <div><label className={labelClass}>Category (EN)</label><input className={inputClass} value={editingSkill.categoryEn || ""} onChange={(e) => setEditingSkill({ ...editingSkill, categoryEn: e.target.value })} placeholder="Frontend" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveSkill} className={btnPrimary}>저장</button>
                <button onClick={() => setEditingSkill(null)} className={btnSecondary}>취소</button>
              </div>
            </div>
          )}

          {(() => {
            const grouped: Record<string, Skill[]> = {};
            for (const s of skills) {
              if (!grouped[s.category]) grouped[s.category] = [];
              grouped[s.category].push(s);
            }
            return Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-sm font-medium text-text-secondary mb-2">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => (
                    <span key={s.id} className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-bg-elevated border border-border rounded-lg">
                      {s.name}
                      <button onClick={() => setEditingSkill(s)} className="text-text-tertiary hover:text-accent text-xs opacity-0 group-hover:opacity-100 transition-opacity">✎</button>
                      <button onClick={() => handleDeleteSkill(s.id)} className="text-text-tertiary hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </span>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── Social Links Tab ── */}
      {tab === "links" && (
        <div className="space-y-4">
          <button onClick={() => setEditingLink({})} className={btnPrimary}>+ 링크 추가</button>

          {editingLink && (
            <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50">
              <div><label className={labelClass}>플랫폼</label><input className={inputClass} value={editingLink.platform || ""} onChange={(e) => setEditingLink({ ...editingLink, platform: e.target.value })} placeholder="GitHub, LinkedIn, Email..." /></div>
              <div><label className={labelClass}>URL</label><input className={inputClass} value={editingLink.url || ""} onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })} placeholder="https://github.com/..." /></div>
              <div className="flex gap-2">
                <button onClick={handleSaveLink} className={btnPrimary}>저장</button>
                <button onClick={() => setEditingLink(null)} className={btnSecondary}>취소</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {links.map((link, idx) => (
              <div key={link.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMoveLink(idx, -1)} disabled={idx === 0} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▲</button>
                  <button onClick={() => handleMoveLink(idx, 1)} disabled={idx === links.length - 1} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{link.platform}</p>
                  <p className="text-xs text-text-tertiary truncate">{link.url}</p>
                </div>
                <button onClick={() => setEditingLink(link)} className={btnSecondary}>수정</button>
                <button onClick={() => handleDeleteLink(link.id)} className="text-xs text-red-500 hover:text-red-400">삭제</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/my/resume/page.tsx
git commit -m "feat: add admin resume management page"
```

---

## Task 10: Admin Series Page

**Files:**
- Create: `src/app/my/series/page.tsx`

- [ ] **Step 1: Create the admin series management page**

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  getSeriesWithPostCount, createSeries, updateSeries, deleteSeries,
  getSeriesPosts, reorderSeriesPosts,
} from "@/actions/series";

type SeriesItem = { id: number; title: string; titleEn: string | null; slug: string; description: string | null; descriptionEn: string | null; createdAt: string; postCount: number };
type SeriesPost = { id: number; title: string; titleEn: string | null; slug: string; seriesOrder: number | null };

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [editing, setEditing] = useState<Partial<SeriesItem> | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [seriesPosts, setSeriesPosts] = useState<SeriesPost[]>([]);

  const reload = async () => {
    const list = await getSeriesWithPostCount();
    setSeriesList(list);
  };

  useEffect(() => { reload(); }, []);

  useEffect(() => {
    if (selectedSeries) {
      getSeriesPosts(selectedSeries).then(setSeriesPosts);
    }
  }, [selectedSeries]);

  const handleSave = async () => {
    if (!editing?.title) return;
    if (editing.id) {
      await updateSeries(editing.id, {
        title: editing.title,
        titleEn: editing.titleEn || undefined,
        description: editing.description || undefined,
        descriptionEn: editing.descriptionEn || undefined,
      });
    } else {
      await createSeries({
        title: editing.title,
        titleEn: editing.titleEn || undefined,
        description: editing.description || undefined,
        descriptionEn: editing.descriptionEn || undefined,
      });
    }
    setEditing(null);
    await reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("시리즈를 삭제하시겠습니까? 포스트는 삭제되지 않습니다.")) return;
    await deleteSeries(id);
    if (selectedSeries === id) { setSelectedSeries(null); setSeriesPosts([]); }
    await reload();
  };

  const handleMovePost = async (idx: number, dir: -1 | 1) => {
    if (!selectedSeries) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= seriesPosts.length) return;
    const newPosts = [...seriesPosts];
    [newPosts[idx], newPosts[swapIdx]] = [newPosts[swapIdx], newPosts[idx]];
    setSeriesPosts(newPosts);
    await reorderSeriesPosts(selectedSeries, newPosts.map((p) => p.id));
  };

  const inputClass = "w-full px-3 py-2 text-sm bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary";
  const labelClass = "block text-xs text-text-tertiary uppercase tracking-wider font-medium mb-1.5";
  const btnPrimary = "px-4 py-2 bg-accent text-bg-primary text-sm font-medium rounded-lg hover:opacity-90 transition-opacity";
  const btnSecondary = "px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-elevated transition-colors";

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">시리즈 관리</h1>

      <button onClick={() => setEditing({})} className={btnPrimary + " mb-4"}>+ 시리즈 추가</button>

      {editing && (
        <div className="p-4 border border-accent/30 rounded-xl space-y-3 bg-bg-elevated/50 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>제목</label><input className={inputClass} value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><label className={labelClass}>Title (EN)</label><input className={inputClass} value={editing.titleEn || ""} onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>설명</label><textarea className={inputClass + " h-20"} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><label className={labelClass}>Description (EN)</label><textarea className={inputClass + " h-20"} value={editing.descriptionEn || ""} onChange={(e) => setEditing({ ...editing, descriptionEn: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className={btnPrimary}>저장</button>
            <button onClick={() => setEditing(null)} className={btnSecondary}>취소</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Series list */}
        <div className="space-y-2">
          {seriesList.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSeries(s.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedSeries === s.id ? "border-accent bg-accent/5" : "border-border hover:border-text-tertiary"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">{s.title}</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">{s.postCount}개 포스트</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditing(s); }} className={btnSecondary}>수정</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-xs text-red-500 hover:text-red-400">삭제</button>
                </div>
              </div>
            </div>
          ))}
          {seriesList.length === 0 && <p className="text-sm text-text-tertiary">시리즈가 없습니다.</p>}
        </div>

        {/* Series posts (reorder) */}
        {selectedSeries && (
          <div>
            <h3 className="text-sm font-medium mb-3">포스트 순서</h3>
            <div className="space-y-2">
              {seriesPosts.map((post, idx) => (
                <div key={post.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMovePost(idx, -1)} disabled={idx === 0} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▲</button>
                    <button onClick={() => handleMovePost(idx, 1)} disabled={idx === seriesPosts.length - 1} className="text-text-tertiary hover:text-text-primary disabled:opacity-30 text-xs">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-text-tertiary mr-2">{idx + 1}.</span>
                    <span className="text-sm">{post.title}</span>
                  </div>
                </div>
              ))}
              {seriesPosts.length === 0 && <p className="text-sm text-text-tertiary">이 시리즈에 포스트가 없습니다.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/my/series/page.tsx
git commit -m "feat: add admin series management page"
```

---

## Task 11: Add Admin Nav Items

**Files:**
- Modify: `src/app/my/layout.tsx`

- [ ] **Step 1: Add resume and series to NAV_ITEMS**

In `src/app/my/layout.tsx`, add two items to the `NAV_ITEMS` array, after the "프로젝트" item and before the "설정" item:

```typescript
{ href: "/my/resume", label: "이력서", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
{ href: "/my/series", label: "시리즈", icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" },
```

- [ ] **Step 2: Commit**

```bash
git add src/app/my/layout.tsx
git commit -m "feat: add resume and series nav items to admin sidebar"
```

---

## Task 12: Add Series Dropdown to Write Page

**Files:**
- Modify: `src/app/my/write/page.tsx`

- [ ] **Step 1: Add series state and fetching**

In `src/app/my/write/page.tsx`, add import:
```typescript
import { getAllSeries } from "@/actions/series";
```

Add state variables after the existing state declarations:
```typescript
const [allSeries, setAllSeries] = useState<{ id: number; title: string }[]>([]);
const [seriesId, setSeriesId] = useState<number | null>(null);
const [seriesOrder, setSeriesOrder] = useState<string>("");
```

In the first `useEffect` (that loads categories and portfolios), add:
```typescript
getAllSeries().then((s) => setAllSeries(s.map((x) => ({ id: x.id, title: x.title }))));
```

In the second `useEffect` (that loads post data for editing), after setting other fields, add:
```typescript
if (post.seriesId) setSeriesId(post.seriesId);
if (post.seriesOrder != null) setSeriesOrder(String(post.seriesOrder));
```

- [ ] **Step 2: Add seriesId and seriesOrder to FormData in handleDraft and handlePublish**

In both `handleDraft` and `handlePublish` functions, add after the other `fd.set` calls:
```typescript
if (seriesId) fd.set("seriesId", String(seriesId));
if (seriesOrder) fd.set("seriesOrder", seriesOrder);
```

- [ ] **Step 3: Add series dropdown UI**

In the JSX, add a series selector after the `<TagInput>` component (around line 197):

```tsx
{/* Series */}
<div className="flex items-center gap-3">
  <select
    value={seriesId || ""}
    onChange={(e) => setSeriesId(e.target.value ? Number(e.target.value) : null)}
    className="px-3 py-1.5 text-sm bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary"
  >
    <option value="">시리즈 없음</option>
    {allSeries.map((s) => (
      <option key={s.id} value={s.id}>{s.title}</option>
    ))}
  </select>
  {seriesId && (
    <input
      type="number"
      value={seriesOrder}
      onChange={(e) => setSeriesOrder(e.target.value)}
      placeholder="순서 (비우면 자동)"
      className="w-40 px-3 py-1.5 text-sm bg-bg-primary border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary"
    />
  )}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/my/write/page.tsx
git commit -m "feat: add series selection dropdown to post editor"
```

---

## Task 13: Public Series Page

**Files:**
- Create: `src/app/series/[slug]/page.tsx`

- [ ] **Step 1: Create the series detail page**

```tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSeriesBySlug, getSeriesPosts } from "@/actions/series";
import { getCategories } from "@/actions/categories";
import { getAllPostTags } from "@/actions/posts";
import { SeriesDetailClient } from "./client";

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) return {};
  return { title: s.title, description: s.description || s.title };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) notFound();

  const [seriesPosts, categories, postTagsMap] = await Promise.all([
    getSeriesPosts(s.id),
    getCategories(),
    getAllPostTags(),
  ]);

  const postsWithCategory = seriesPosts.map((post) => {
    const cat = categories.find((c) => c.id === post.categoryId);
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags: postTagsMap[post.id] || [],
    };
  });

  return <SeriesDetailClient series={s} posts={postsWithCategory} />;
}
```

- [ ] **Step 2: Create the client component**

Create `src/app/series/[slug]/client.tsx`:

```tsx
"use client";

import { useI18n, useLocalized } from "@/i18n/provider";
import { PostCard } from "@/components/blog/PostCard";

interface SeriesDetailClientProps {
  series: { title: string; titleEn: string | null; description: string | null; descriptionEn: string | null };
  posts: {
    id: number; title: string; titleEn: string | null; slug: string;
    thumbnail: string | null; createdAt: string;
    categoryName: string; categoryNameEn: string;
    tags?: { name: string; nameEn: string }[];
  }[];
}

export function SeriesDetailClient({ series, posts }: SeriesDetailClientProps) {
  const { t } = useI18n();
  const localized = useLocalized();

  return (
    <div className="page-container py-16">
      <header className="mb-12">
        <span className="text-xs text-accent font-medium uppercase tracking-wider">{t("series.title")}</span>
        <h1 className="text-2xl md:text-4xl font-bold leading-tight mt-2">
          {localized(series.title, series.titleEn)}
        </h1>
        {series.description && (
          <p className="text-text-secondary mt-4 max-w-prose">
            {localized(series.description, series.descriptionEn)}
          </p>
        )}
        <p className="text-sm text-text-tertiary mt-2">{posts.length} {t("series.postsCount")}</p>
      </header>
      <div className="space-y-4">
        {posts.map((post, idx) => (
          <div key={post.id} className="flex items-start gap-4">
            <span className="text-lg font-bold text-text-tertiary mt-1 w-8 shrink-0 text-right">{idx + 1}</span>
            <div className="flex-1">
              <PostCard {...post} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/series/\[slug\]/page.tsx src/app/series/\[slug\]/client.tsx
git commit -m "feat: add public series detail page"
```

---

## Task 14: Verify & Fix

- [ ] **Step 1: Run the dev server and check for TypeScript/build errors**

Run: `npx next build` (or `npm run build`)
Expected: Build succeeds without errors

- [ ] **Step 2: Fix any type errors or import issues found**

- [ ] **Step 3: Test key flows manually**

1. Visit `/my/resume` — verify tabs, CRUD for all sections
2. Visit `/my/series` — create a series, verify it appears
3. Visit `/my/write` — verify series dropdown appears
4. Visit `/` — verify resume layout renders
5. Visit `/series/[slug]` — verify series page
6. Visit `/post/[slug]` for a series post — verify TOC and prev/next

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve build issues for resume and series features"
```
