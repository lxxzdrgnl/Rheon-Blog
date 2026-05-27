"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useState } from "react";
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
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/90 backdrop-blur-xl">
      <div className="page-container">
        <div className="h-14 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-base font-bold tracking-tight text-text-primary hover:opacity-70">
              {blogTitle}
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-text-primary transition-colors">
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

          <button
            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
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

      {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}
    </header>
  );
}
