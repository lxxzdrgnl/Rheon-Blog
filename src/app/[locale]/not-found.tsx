"use client";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { useI18n } from "@/i18n/provider";

export default function NotFound() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-text-tertiary tracking-widest uppercase mb-3">404</p>
      <h1 className="text-2xl font-bold tracking-tight">
        {en ? "Page not found" : "페이지를 찾을 수 없습니다"}
      </h1>
      <p className="text-sm text-text-secondary mt-3">
        {en
          ? "The page you requested doesn't exist or has been removed."
          : "요청하신 페이지가 존재하지 않거나 삭제되었습니다."}
      </p>
      <Link
        href="/"
        className="mt-8 px-5 py-2.5 rounded-lg bg-accent text-bg-primary text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {en ? "Back to home" : "홈으로 돌아가기"}
      </Link>
    </div>
  );
}
