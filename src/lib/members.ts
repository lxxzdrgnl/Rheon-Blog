/**
 * 프로젝트 팀원(members) 파싱·정규화 — 서버·클라이언트·MCP 공용 순수 함수.
 * portfolios.members는 link와 같이 text 컬럼에 JSON 배열 문자열로 저장된다.
 */

export interface ProjectMember {
  /** isMe 행은 빈 문자열 — 이름은 settings의 resume_name에서 읽는다 */
  name: string;
  nameEn?: string;
  /** isMe 행은 저장하지 않음 — social_links의 github URL을 쓴다 */
  github?: string;
  /** 역할 겸 상세설명. 자유 서술 */
  role: string;
  roleEn?: string;
  isMe?: boolean;
}

/** 저장된 JSON 문자열 → 팀원 배열. 깨진 값·레거시 값은 빈 배열로 흘린다. */
export function parseMembers(json: string | null | undefined): ProjectMember[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m): m is ProjectMember => {
      if (!m || typeof m !== "object") return false;
      const rec = m as Record<string, unknown>;
      return rec.isMe === true || typeof rec.name === "string";
    });
  } catch {
    return [];
  }
}

/** GitHub URL에서 표시용 아이디를 뽑는다. URL이 아니면 입력을 그대로 본다. */
export function githubHandle(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  return trimmed.split("/").filter(Boolean).pop() || null;
}

/** isMe 행을 정확히 하나, 항상 배열 맨 앞에 둔다. */
export function normalizeMembers(members: ProjectMember[]): ProjectMember[] {
  const me = members.find((m) => m.isMe) ?? { name: "", role: "", isMe: true };
  const others = members.filter((m) => !m.isMe);
  return [{ ...me, isMe: true }, ...others];
}
