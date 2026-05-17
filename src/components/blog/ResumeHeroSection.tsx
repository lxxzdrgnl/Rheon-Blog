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
