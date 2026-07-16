/**
 * 진행중 프로젝트 뱃지 — 홈 행(ResumeLayout)·프로젝트 카드·상세 헤더 공용.
 * "use client"를 붙이지 않아 서버 컴포넌트(ProjectCard)와 클라이언트 양쪽에서 쓸 수 있다.
 * 문구는 locale prop으로 갈린다 — 서버에서 훅을 못 쓰기 때문.
 *
 * variant:
 *  - "soft"(기본)  텍스트 위에 얹히는 자리(홈 행·상세 헤더). 기술 칩과 같은 톤이라
 *                  제목보다 튀지 않는다. 진행 여부는 부차 정보이므로 이게 기본이다.
 *  - "solid"       썸네일 이미지 위에 얹히는 자리(카드). 반투명하면 사진에 묻혀 안 읽힌다.
 */
export function InProgressBadge({
  locale,
  variant = "soft",
  className = "",
}: {
  locale: string;
  variant?: "soft" | "solid";
  className?: string;
}) {
  const tone =
    variant === "solid"
      ? "bg-accent text-white shadow-sm"
      : "bg-accent-soft text-accent border border-accent/20";
  const dot = variant === "solid" ? "bg-white" : "bg-accent";

  return (
    <span
      className={`inline-flex items-center gap-1.5 shrink-0 rounded-full py-0.5 pl-1.5 pr-2 text-[11px] font-semibold tracking-tight ${tone} ${className}`}
    >
      <span className={`w-1 h-1 rounded-full ${dot} animate-pulse motion-reduce:animate-none`} />
      {locale === "en" ? "In progress" : "진행중"}
    </span>
  );
}
