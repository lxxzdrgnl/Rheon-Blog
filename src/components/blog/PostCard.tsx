"use client";

import Link from "next/link";
import { useLocalized } from "@/i18n/provider";

interface PostCardProps {
  title: string;
  titleEn: string | null;
  slug: string;
  thumbnail: string | null;
  createdAt: string;
  categoryName: string;
  categoryNameEn: string;
  tags?: { name: string; nameEn: string }[];
  thumbnailTextLength?: number | null;
}

const PATTERNS = [
  `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-10 10L10-10M30 50L50 30' stroke='%23fff' stroke-width='1' opacity='0.07'/%3E%3C/svg%3E")`,
  `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='24' cy='24' r='8' fill='none' stroke='%23fff' stroke-width='0.8' opacity='0.06'/%3E%3C/svg%3E")`,
  `url("data:image/svg+xml,%3Csvg width='32' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 8v16M8 16h16' stroke='%23fff' stroke-width='0.8' opacity='0.06'/%3E%3C/svg%3E")`,
  `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.2' fill='%23fff' opacity='0.08'/%3E%3C/svg%3E")`,
];

const GRADIENTS = [
  "from-[#1a2e28] to-[#243832]",
  "from-[#1e2226] to-[#282d31]",
  "from-[#1c2030] to-[#262a38]",
  "from-[#2a2520] to-[#332e28]",
  "from-[#261e22] to-[#30272b]",
  "from-[#1b2528] to-[#252f32]",
];

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function PostCard({ title, titleEn, slug, thumbnail, createdAt, categoryName, categoryNameEn, tags, thumbnailTextLength }: PostCardProps) {
  const localized = useLocalized();
  const displayTitle = localized(title, titleEn);
  const displayCategory = localized(categoryName, categoryNameEn);

  const hash = hashString(title);
  const gradient = GRADIENTS[hash % GRADIENTS.length];
  const pattern = PATTERNS[hash % PATTERNS.length];

  return (
    <Link href={`/post/${slug}`} className="group block">
      <article>
        {/* ── Visual ── */}
        {thumbnail ? (
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-bg-card">
            <img
              src={thumbnail}
              alt={displayTitle}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.06] pointer-events-none" />
          </div>
        ) : (
          <div className={`relative aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0" style={{ backgroundImage: pattern }} />
            <div className="absolute -bottom-1/3 -right-1/4 w-2/3 h-2/3 rounded-full bg-white/[0.04] blur-2xl" />
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-white/[0.03] blur-3xl" />
            <div className="relative h-full flex items-center justify-center p-4">
              <h3 className="font-serif text-6xl md:text-7xl font-black leading-[0.9] text-white tracking-tighter text-center break-keep">
                {displayTitle.slice(0, thumbnailTextLength || 8)}
              </h3>
            </div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.08] pointer-events-none" />
          </div>
        )}

        {/* ── Meta ── */}
        <div className="mt-3 px-0.5">
          <h3 className="font-semibold text-[15px] text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-200">
            {displayTitle}
          </h3>

          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-tertiary">
            {displayCategory && (
              <>
                <span className="text-text-secondary">{displayCategory}</span>
                <span className="text-border">·</span>
              </>
            )}
            <span>{new Date(createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}</span>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag.name} className="text-[11px] text-accent/70 font-medium">
                  #{localized(tag.name, tag.nameEn)}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-[11px] text-text-tertiary">+{tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
