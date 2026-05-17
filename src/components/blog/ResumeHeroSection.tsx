"use client";

import { useLocalized } from "@/i18n/provider";

const PLATFORM_ICONS: Record<string, string> = {
  github: "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12.01 12.01 0 0024 12c0-6.63-5.37-12-12-12z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  email: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
};

interface ResumeHeroSectionProps {
  name: string;
  nameEn: string;
  title: string;
  titleEn: string;
  tagline: string;
  taglineEn: string;
  profileImage: string | null;
  links: { id: number; platform: string; url: string }[];
}

export function ResumeHeroSection({ name, nameEn, title, titleEn, tagline, taglineEn, profileImage, links }: ResumeHeroSectionProps) {
  const localized = useLocalized();

  return (
    <section className="pt-16 pb-6 md:pt-24 md:pb-10">
      <div className="page-container">
        <div className="flex flex-col-reverse md:flex-row md:items-start md:gap-12">
          <div className="md:flex-1 mt-6 md:mt-0">
            <div className="flex items-center gap-3 mb-4 animate-fade-in">
              <div className="h-px flex-1 max-w-12 bg-accent/60" />
              <span className="text-xs text-accent font-semibold tracking-[0.2em] uppercase">
                {localized(title, titleEn)}
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight animate-fade-in animate-delay-1">
              {localized(name, nameEn)}
            </h1>
            <p className="mt-4 text-base md:text-lg text-text-secondary max-w-md leading-relaxed animate-fade-in animate-delay-2">
              {localized(tagline, taglineEn)}
            </p>
            {links.length > 0 && (
              <div className="flex items-center gap-4 mt-6 animate-fade-in animate-delay-3">
                {links.map((link) => {
                  const iconPath = PLATFORM_ICONS[link.platform.toLowerCase()];
                  const href = link.platform.toLowerCase() === "email" ? `mailto:${link.url}` : link.url;
                  return (
                    <a
                      key={link.id}
                      href={href}
                      target={link.platform.toLowerCase() === "email" ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-text-tertiary hover:text-accent transition-colors duration-300"
                      title={link.platform}
                    >
                      {iconPath && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d={iconPath} />
                        </svg>
                      )}
                      <span className="text-sm hidden sm:inline group-hover:underline underline-offset-4">{link.platform}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          {profileImage && (
            <div className="shrink-0 animate-fade-in">
              <div className="relative">
                <img
                  src={profileImage}
                  alt={localized(name, nameEn)}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover shadow-lg"
                />
                <div className="absolute -inset-1 rounded-2xl border border-accent/20 -z-10" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
