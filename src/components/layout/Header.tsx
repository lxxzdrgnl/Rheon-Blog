"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useState, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { MobileMenu } from "./MobileMenu";
import { NAV_LINKS } from "./navLinks";
import { useI18n } from "@/i18n/provider";

interface HeaderProps {
  blogTitle: string;
}

export function Header({ blogTitle }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    lastYRef.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 64) setHidden(false);          // 최상단 근처: 항상 표시
      else if (y > lastYRef.current) setHidden(true);   // 아래로 스크롤: 숨김
      else if (y < lastYRef.current) setHidden(false);  // 위로 스크롤: 표시
      lastYRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      // reduced-motion: 헤더를 숨기지 않고 항상 보이게 — 큰 요소의 반복 이동은 전정기관을 자극한다
      className={`sticky top-0 z-50 bg-bg-primary/90 backdrop-blur-xl relative ${
        reduceMotion ? "" : "transition-transform duration-300"
      } ${
        hidden && !mobileMenuOpen && !reduceMotion ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="page-container">
        <div className="h-14 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-lg md:text-base font-bold tracking-tight text-text-primary hover:text-accent transition-colors">
              {blogTitle}
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-accent transition-colors">
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="w-44">
              <SearchBar />
            </div>
            <LanguageToggle />
            <ThemeToggle />
          </div>

          <div className="flex md:hidden items-center gap-1 [&_button]:text-[15px] [&_svg]:w-6 [&_svg]:h-6">
            <LanguageToggle />
            <ThemeToggle />
            <button
              className="p-2 text-text-secondary hover:text-accent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}
    </header>
  );
}
