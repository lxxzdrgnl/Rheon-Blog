/**
 * 진행중 프로젝트 뱃지 — 홈 행(ResumeLayout)·프로젝트 카드·상세 헤더 공용.
 * "use client"를 붙이지 않아 서버 컴포넌트(ProjectCard)와 클라이언트 양쪽에서 쓸 수 있다.
 * 문구는 locale prop으로 갈린다 — 서버에서 훅을 못 쓰기 때문.
 */
export function InProgressBadge({ locale, className = "" }: { locale: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 shrink-0 rounded-full bg-accent py-0.5 pl-1.5 pr-2 text-[11px] font-bold tracking-tight text-white shadow-sm ${className}`}
    >
      <span className="w-1 h-1 rounded-full bg-white animate-pulse motion-reduce:animate-none" />
      {locale === "en" ? "In progress" : "진행중"}
    </span>
  );
}
