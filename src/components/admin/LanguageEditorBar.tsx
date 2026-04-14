"use client";

interface LanguageEditorBarProps {
  lang: "ko" | "en";
  onLangChange: (lang: "ko" | "en") => void;
  translating: boolean;
  onTranslate: () => void;
}

export function LanguageEditorBar({ lang, onLangChange, translating, onTranslate }: LanguageEditorBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 bg-bg-elevated rounded-lg p-0.5">
        <button
          onClick={() => onLangChange("ko")}
          className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${lang === "ko" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
        >
          한국어
        </button>
        <button
          onClick={() => onLangChange("en")}
          className={`px-3 py-1 text-xs rounded-md transition-colors font-medium ${lang === "en" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"}`}
        >
          English
        </button>
      </div>
      <button
        onClick={onTranslate}
        disabled={translating}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-bg-elevated transition-colors text-text-secondary disabled:opacity-50"
      >
        {translating ? (
          <>
            <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            번역 중...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
            AI 번역
          </>
        )}
      </button>
    </div>
  );
}
