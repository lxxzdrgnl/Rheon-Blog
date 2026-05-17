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
    <section className="page-container pb-10">
      <div className="relative p-6 md:p-8 rounded-2xl bg-bg-card/50 border border-border/40">
        <span className="absolute -top-3 left-6 px-3 bg-bg-primary text-xs font-semibold text-accent tracking-[0.15em] uppercase">
          {t("resume.about")}
        </span>
        <div className="max-w-prose text-text-secondary leading-relaxed text-[0.95rem]">
          <MarkdownRenderer content={displayContent} />
        </div>
      </div>
    </section>
  );
}
