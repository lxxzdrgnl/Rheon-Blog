"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { NAV_LINKS } from "./navLinks";
import { useI18n } from "@/i18n/provider";

interface MobileMenuProps {
  onClose: () => void;
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const { t } = useI18n();

  return (
    <div className="md:hidden absolute top-full inset-x-0 z-50 border-t border-border bg-bg-primary shadow-lg px-6 py-4 space-y-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
      <SearchBar onSubmit={onClose} />
      <nav className="flex flex-col gap-3 text-sm">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={onClose} className="text-text-secondary hover:text-accent transition-colors">
            {t(link.labelKey)}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}
