"use client";

import { useLocalized } from "@/i18n/provider";

interface HeroSectionProps {
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  image?: string | null;
}

export function HeroSection({ title, titleEn, subtitle, subtitleEn, image }: HeroSectionProps) {
  const localized = useLocalized();
  const displayTitle = localized(title, titleEn);
  const displaySubtitle = localized(subtitle, subtitleEn);

  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="page-container">
        <div className={`flex flex-col ${image ? "md:flex-row md:items-center md:gap-16" : ""}`}>
          <div className={image ? "md:flex-1" : ""}>
            <h1 className="text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight animate-fade-in">
              {displayTitle}
            </h1>
            <p className="mt-5 text-lg md:text-xl text-text-secondary max-w-lg leading-relaxed animate-fade-in animate-delay-1">
              {displaySubtitle}
            </p>
          </div>
          {image && (
            <div className="mt-10 md:mt-0 md:flex-1 animate-fade-in animate-delay-2">
              <img
                src={image}
                alt=""
                className="w-full max-w-md mx-auto md:max-w-none rounded-xl"
              />
            </div>
          )}
        </div>
        <div className="mt-10 h-px bg-gradient-to-r from-accent/40 via-border to-transparent animate-fade-in animate-delay-2" />
      </div>
    </section>
  );
}
