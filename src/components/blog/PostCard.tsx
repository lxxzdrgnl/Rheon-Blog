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
