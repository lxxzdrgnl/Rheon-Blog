import type { ReactNode } from "react";

/**
 * 검색어와 일치하는 구간을 굵게 강조 (구글 검색 결과처럼). 대소문자 무시, 리터럴 매칭.
 * 서버/클라이언트 양쪽에서 쓸 수 있도록 훅 없는 순수 컴포넌트.
 */
export function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query || !text) return <>{text}</>;

  const lc = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;
  let idx = lc.indexOf(q);
  let key = 0;
  while (idx !== -1) {
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={key++} className="bg-transparent font-bold text-accent">
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
    idx = lc.indexOf(q, i);
  }
  if (i < text.length) parts.push(text.slice(i));
  return <>{parts}</>;
}
