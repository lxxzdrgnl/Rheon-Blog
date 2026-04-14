"use client";

import Link from "next/link";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useI18n } from "@/i18n/provider";

interface MobileMenuProps {
  onClose: () => void;
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const { t } = useI18n();

  return (
    <div className="md:hidden border-t border-border bg-bg-primary px-6 py-4 space-y-4">
      <SearchBar />
      <nav className="flex flex-col gap-3 text-sm">
        <Link href="/" onClick={onClose} className="text-text-secondary hover:text-text-primary">
          {t("nav.home")}
        </Link>
        <Link href="/search" onClick={onClose} className="text-text-secondary hover:text-text-primary">
          {t("nav.search")}
        </Link>
      </nav>
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}
