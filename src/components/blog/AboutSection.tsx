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
    <section className="page-container py-8">
      <div className="max-w-prose text-text-secondary leading-[1.8] text-[0.925rem]">
        <MarkdownRenderer content={displayContent} />
      </div>
    </section>
  );
}
