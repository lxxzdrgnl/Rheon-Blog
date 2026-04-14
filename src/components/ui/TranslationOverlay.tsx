"use client";

export function TranslationOverlay() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-primary rounded-2xl border border-border shadow-2xl px-10 py-8 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-base font-bold">AI 번역 생성 중...</p>
          <p className="text-sm text-text-tertiary mt-1">영문 번역을 생성하고 있습니다</p>
        </div>
      </div>
    </div>
  );
}
