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
