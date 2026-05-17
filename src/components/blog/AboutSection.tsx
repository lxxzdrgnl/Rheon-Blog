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
